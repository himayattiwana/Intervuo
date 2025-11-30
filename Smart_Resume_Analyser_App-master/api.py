from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import re
import time
from pdfminer.high_level import extract_text
import random
from Courses import ds_course, web_course, android_course, ios_course, uiux_course
import google.generativeai as genai
from config import GEMINI_API_KEY, NUM_QUESTIONS, DIFFICULTY_MAPPING, GEMINI_MODEL, TEMPERATURE
import uuid
from datetime import datetime
from sentiment_emotion_analyzer import (
    SentimentAnalyzer, 
    FacialExpressionAnalyzer, 
    calculate_combined_score,
    TEXTBLOB_AVAILABLE,
    VADER_AVAILABLE,
    OPENCV_AVAILABLE
)

app = Flask(__name__)
CORS(app)

# Initialize sentiment and emotion analyzers
sentiment_analyzer = SentimentAnalyzer()
emotion_analyzer = FacialExpressionAnalyzer()

# Configure Gemini AI
genai.configure(api_key=GEMINI_API_KEY)

# Safety settings to prevent blocking
safety_settings = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_NONE"
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_NONE"
    },
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_NONE"
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_NONE"
    },
]

model = genai.GenerativeModel(
    GEMINI_MODEL,
    generation_config={
        "temperature": TEMPERATURE,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 2048,
    },
    safety_settings=safety_settings
)

# Initialize database connection globally
db_connection = None
db_cursor = None

try:
    import pymysql
    # Get database credentials from environment variables (for production) or use defaults (for local)
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_USER = os.environ.get('DB_USER', 'root')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
    DB_NAME = os.environ.get('DB_NAME', 'sra')
    DB_PORT = int(os.environ.get('DB_PORT', '3306'))
    
    # Connect to database
    db_connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT,
        charset='utf8mb4'
    )
    db_cursor = db_connection.cursor()
    
    # Create database if not exists (only if using localhost, cloud DBs usually pre-create)
    if DB_HOST == 'localhost':
        db_cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME};")
    
    db_connection.select_db(DB_NAME)
    
    # Create interview_sessions table
    session_table_sql = """
    CREATE TABLE IF NOT EXISTS interview_sessions (
        session_id VARCHAR(50) PRIMARY KEY,
        user_name VARCHAR(100),
        user_email VARCHAR(100),
        resume_field VARCHAR(50),
        experience_level VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    db_cursor.execute(session_table_sql)
    
    # Create interview_answers table
    answers_table_sql = """
    CREATE TABLE IF NOT EXISTS interview_answers (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(50) NOT NULL,
        question_number INT NOT NULL,
        question_text TEXT NOT NULL,
        answer_text TEXT,
        audio_filename VARCHAR(255),
        feedback_score DECIMAL(3,1) DEFAULT NULL,
        feedback_good TEXT,
        feedback_improve TEXT,
        content_score DECIMAL(3,1) DEFAULT NULL,
        sentiment_score DECIMAL(3,1) DEFAULT NULL,
        emotion_score DECIMAL(3,1) DEFAULT NULL,
        sentiment_data JSON,
        emotion_data JSON,
        answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id)
    );
    """
    db_cursor.execute(answers_table_sql)
    
    # Try to add new columns if table already exists (for backward compatibility)
    # Update feedback_score to DECIMAL if it's INT
    try:
        db_cursor.execute("ALTER TABLE interview_answers MODIFY COLUMN feedback_score DECIMAL(3,1) DEFAULT NULL")
    except:
        pass  # Column might not exist or already correct type
    
    try:
        db_cursor.execute("ALTER TABLE interview_answers ADD COLUMN content_score DECIMAL(3,1) DEFAULT NULL")
    except:
        pass  # Column already exists
    
    try:
        db_cursor.execute("ALTER TABLE interview_answers ADD COLUMN sentiment_score DECIMAL(3,1) DEFAULT NULL")
    except:
        pass
    
    try:
        db_cursor.execute("ALTER TABLE interview_answers ADD COLUMN emotion_score DECIMAL(3,1) DEFAULT NULL")
    except:
        pass
    
    try:
        db_cursor.execute("ALTER TABLE interview_answers ADD COLUMN sentiment_data JSON")
    except:
        pass
    
    try:
        db_cursor.execute("ALTER TABLE interview_answers ADD COLUMN emotion_data JSON")
    except:
        pass
    
    db_connection.commit()
    print("✅ Database tables created successfully")
    
except Exception as e:
    print(f"❌ Database setup error: {e}")
    db_connection = None
    db_cursor = None

# Create upload folder if it doesn't exist
UPLOAD_FOLDER = './Uploaded_Resumes'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Audio storage folder
AUDIO_FOLDER = './Interview_Recordings'
if not os.path.exists(AUDIO_FOLDER):
    os.makedirs(AUDIO_FOLDER)

def extract_text_from_pdf(file_path):
    """Extract text from PDF using pdfminer"""
    try:
        text = extract_text(file_path)
        return text
    except Exception as e:
        print(f"Error extracting text: {e}")
        return ""

def extract_email(text):
    """Extract email from text"""
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    return emails[0] if emails else "Not found"

def extract_phone(text):
    """Extract phone number from text"""
    phone_patterns = [
        r'[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}',
        r'\d{10}',
        r'\d{3}[-\.\s]\d{3}[-\.\s]\d{4}',
        r'\(\d{3}\)\s*\d{3}[-\.\s]\d{4}',
        r'\+\d{1,3}\s?\d{10}',
    ]
    for pattern in phone_patterns:
        phones = re.findall(pattern, text)
        if phones:
            return phones[0]
    return "Not found"

def extract_name(text):
    """Extract name from resume (usually in first few lines)"""
    lines = text.split('\n')
    for line in lines[:10]:
        line = line.strip()
        if line and len(line) < 50 and not '@' in line and not any(char.isdigit() for char in line):
            words = line.split()
            if 2 <= len(words) <= 4 and all(word.replace('.', '').isalpha() for word in words):
                return line
    return "Not found"

def count_pages(file_path):
    """Count number of pages in PDF"""
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(file_path)
        return len(reader.pages)
    except:
        text = extract_text_from_pdf(file_path)
        return max(1, len(text) // 3000)

def extract_skills(text):
    """Extract skills from resume text"""
    text_lower = text.lower()
    
    all_skills = {
        'python', 'java', 'javascript', 'c++', 'c#', 'php', 'ruby', 'go', 'swift', 'kotlin',
        'typescript', 'scala', 'r', 'matlab', 'perl', 'rust',
        'html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
        'spring', 'laravel', 'jquery', 'bootstrap', 'tailwind', 'webpack', 'next.js',
        'android', 'ios', 'flutter', 'react native', 'xamarin', 'ionic',
        'sql', 'mysql', 'postgresql', 'mongodb', 'oracle', 'redis', 'cassandra',
        'dynamodb', 'sqlite', 'firebase',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github',
        'gitlab', 'ci/cd', 'terraform', 'ansible',
        'machine learning', 'deep learning', 'tensorflow', 'keras', 'pytorch', 
        'scikit-learn', 'pandas', 'numpy', 'data analysis', 'nlp', 'computer vision',
        'figma', 'adobe xd', 'sketch', 'photoshop', 'illustrator', 'ui design',
        'ux design', 'wireframing', 'prototyping',
        'agile', 'scrum', 'jira', 'rest api', 'graphql', 'microservices',
        'testing', 'debugging', 'problem solving'
    }
    
    found_skills = []
    for skill in all_skills:
        if skill in text_lower:
            found_skills.append(skill.title())
    
    return found_skills[:15]

def get_course_recommendations(course_list, num_courses=3):
    """Get random course recommendations"""
    random.shuffle(course_list)
    return [{"name": name, "link": link} for name, link in course_list[:num_courses]]

def analyze_skills(skills, resume_text):
    """Analyze skills and provide recommendations"""
    ds_keyword = ['tensorflow', 'keras', 'pytorch', 'machine learning', 'deep learning', 'flask',
                  'streamlit', 'data science', 'data analysis', 'pandas', 'numpy']
    web_keyword = ['react', 'django', 'node js', 'react js', 'php', 'laravel', 'magento', 'wordpress',
                   'javascript', 'angular', 'vue', 'html', 'css', 'express']
    android_keyword = ['android', 'android development', 'flutter', 'kotlin', 'java', 'react native']
    ios_keyword = ['ios', 'ios development', 'swift', 'xcode', 'objective-c']
    uiux_keyword = ['ux', 'ui', 'figma', 'adobe xd', 'sketch', 'photoshop', 'wireframe', 'prototype']

    skills_lower = [s.lower() for s in skills]
    
    recommended_skills = []
    reco_field = ''
    courses = []

    if any(skill in skills_lower for skill in ds_keyword):
        reco_field = 'Data Science'
        recommended_skills = ['Data Visualization', 'Predictive Analysis', 'Statistical Modeling',
                            'Data Mining', 'Clustering & Classification', 'Data Analytics',
                            'Quantitative Analysis', 'Web Scraping', 'ML Algorithms', 'Keras',
                            'Pytorch', 'Probability', 'Scikit-learn', 'Tensorflow', 'Flask', 'Streamlit']
        courses = get_course_recommendations(ds_course)
    elif any(skill in skills_lower for skill in web_keyword):
        reco_field = 'Web Development'
        recommended_skills = ['React', 'Django', 'Node.js', 'TypeScript', 'PHP', 'Laravel', 'Magento',
                            'WordPress', 'Javascript', 'Angular', 'Vue.js', 'Flask', 'REST API']
        courses = get_course_recommendations(web_course)
    elif any(skill in skills_lower for skill in android_keyword):
        reco_field = 'Android Development'
        recommended_skills = ['Android', 'Android Development', 'Flutter', 'Kotlin', 'XML', 'Java',
                            'Jetpack Compose', 'GIT', 'SDK', 'SQLite']
        courses = get_course_recommendations(android_course)
    elif any(skill in skills_lower for skill in ios_keyword):
        reco_field = 'IOS Development'
        recommended_skills = ['IOS', 'IOS Development', 'Swift', 'SwiftUI', 'Cocoa Touch', 'Xcode',
                            'Objective-C', 'SQLite', 'Core Data', 'StoreKit', 'UIKit']
        courses = get_course_recommendations(ios_course)
    elif any(skill in skills_lower for skill in uiux_keyword):
        reco_field = 'UI-UX Development'
        recommended_skills = ['UI', 'User Experience', 'Adobe XD', 'Figma', 'Sketch', 'InVision',
                            'Prototyping', 'Wireframes', 'User Research', 'Adobe Photoshop',
                            'Illustrator', 'After Effects', 'Design Thinking']
        courses = get_course_recommendations(uiux_course)
    else:
        reco_field = 'General'
        recommended_skills = ['Communication', 'Problem Solving', 'Time Management', 'Teamwork',
                            'Leadership', 'Critical Thinking', 'Adaptability']
        courses = get_course_recommendations(web_course)
    
    return recommended_skills, reco_field, courses

def calculate_resume_score(resume_text):
    """Calculate resume score based on sections"""
    score = 0
    tips = []
    text_lower = resume_text.lower()
    
    if 'objective' in text_lower or 'summary' in text_lower or 'about' in text_lower:
        score += 20
        tips.append({"present": True, "text": "Great! You have added Career Objective/Summary"})
    else:
        tips.append({"present": False, "text": "Add a Career Objective to show your career intention"})
    
    if 'declaration' in text_lower or 'declare' in text_lower:
        score += 20
        tips.append({"present": True, "text": "Excellent! Declaration section is present"})
    else:
        tips.append({"present": False, "text": "Add a Declaration section for authenticity"})
    
    if 'hobbies' in text_lower or 'interests' in text_lower or 'hobby' in text_lower:
        score += 20
        tips.append({"present": True, "text": "Good! Hobbies section shows your personality"})
    else:
        tips.append({"present": False, "text": "Add Hobbies to show your personality"})
    
    if 'achievement' in text_lower or 'award' in text_lower or 'certificate' in text_lower:
        score += 20
        tips.append({"present": True, "text": "Awesome! Achievements/Awards section found"})
    else:
        tips.append({"present": False, "text": "Add Achievements to stand out"})
    
    if 'project' in text_lower or 'portfolio' in text_lower:
        score += 20
        tips.append({"present": True, "text": "Perfect! Projects section demonstrates experience"})
    else:
        tips.append({"present": False, "text": "Add Projects to show practical experience"})
    
    return score, tips

def extract_resume_sections(resume_text):
    """Extract specific sections from resume for better context"""
    text_lower = resume_text.lower()
    sections = {
        'projects': '',
        'experience': '',
        'education': '',
        'summary': ''
    }
    
    project_keywords = ['project', 'portfolio', 'work']
    for keyword in project_keywords:
        if keyword in text_lower:
            start_idx = text_lower.find(keyword)
            sections['projects'] = resume_text[start_idx:start_idx+800]
            break
    
    exp_keywords = ['experience', 'employment', 'work history']
    for keyword in exp_keywords:
        if keyword in text_lower:
            start_idx = text_lower.find(keyword)
            sections['experience'] = resume_text[start_idx:start_idx+800]
            break
    
    summary_keywords = ['summary', 'objective', 'about']
    for keyword in summary_keywords:
        if keyword in text_lower:
            start_idx = text_lower.find(keyword)
            sections['summary'] = resume_text[start_idx:start_idx+400]
            break
    
    return sections


def _normalize_finish_reason(value):
    """Handle both numeric and string finish reason values from Gemini SDK."""
    if value is None:
        return None
    try:
        numeric_reason = int(value)
        return numeric_reason
    except (ValueError, TypeError):
        normalized = str(value).upper()
        mapping = {
            "FINISH_REASON_UNSPECIFIED": 0,
            "STOP": 1,
            "SAFETY": 2,
            "RECITATION": 3,
            "MAX_TOKENS": 4,
            "OTHER": 5,
        }
        return mapping.get(normalized, None)


def _extract_gemini_text(response):
    """Best-effort extraction of text segments from Gemini response."""
    segments = []
    if not response:
        return segments

    if getattr(response, "text", None):
        segments.append(response.text)

    candidates = getattr(response, "candidates", None) or []
    for candidate in candidates:
        finish_reason = _normalize_finish_reason(getattr(candidate, "finish_reason", None))
        if finish_reason == 2:
            # Candidate blocked by safety filter
            continue

        content = getattr(candidate, "content", None)
        parts = getattr(content, "parts", None) if content else None
        if parts:
            for part in parts:
                text_part = getattr(part, "text", None)
                if text_part:
                    segments.append(text_part)
        if segments:
            break

    return segments


def _get_block_reason(response):
    feedback = getattr(response, "prompt_feedback", None)
    if not feedback:
        return None
    return getattr(feedback, "block_reason", None) or getattr(feedback, "safety_ratings", None)


def generate_interview_questions(skills, field, level, resume_text, name, email, question_count=None):
    """Generate interview questions using Google Gemini AI"""
    try:
        if question_count is None:
            question_count = NUM_QUESTIONS
        question_count = max(1, min(12, int(question_count)))
        difficulty = DIFFICULTY_MAPPING.get(level, 'intermediate-level')
        skills_str = ", ".join(skills[:15]) if skills else "general technical skills"
        
        sections = extract_resume_sections(resume_text)
        
        # Enhanced prompt for more natural, unique questions
        prompt = f"""You are conducting a real interview with {name}. Generate {question_count} NATURAL, CONVERSATIONAL questions that feel spontaneous and human.

CANDIDATE PROFILE:
Name: {name}
Field: {field}  
Level: {level}
Skills: {skills_str}

RESUME HIGHLIGHTS:
{sections['projects'][:400]}
{sections['experience'][:400]}

CRITICAL INSTRUCTIONS:
1. Make questions sound NATURAL - as if you're having a real conversation
2. NEVER use templates like "Tell me about..." or "Describe your experience with..."
3. Reference their ACTUAL projects/work when possible
4. Be conversational: "I noticed you worked with X - what made you choose it over Y?"
5. Mix up sentence structures - use fragments, rhetorical questions, casual language
6. Make it feel like you're genuinely curious about their work
7. Avoid corporate/formal language - be human and engaging

FORBIDDEN PHRASES (never use these):
- "Tell me about..."
- "Describe your experience..."
- "Walk me through..."
- "Can you explain..."
- "What is your understanding of..."

GOOD EXAMPLES OF NATURAL QUESTIONS:
- "So {skills[0] if skills else 'Python'} - what's been your biggest headache working with it?"
- "I'm curious, when you built that {field.lower()} project, how did you handle the data persistence layer?"
- "You mentioned {skills[1] if len(skills) > 1 else 'databases'} on your resume. What's one thing you wish you knew earlier about it?"
- "Looking at your background, you seem to bounce between {skills[0] if skills else 'tech'} and {skills[1] if len(skills) > 1 else 'other tech'}. What draws you to both?"

QUESTION MIX:
- 3 technical deep-dives (specific to their skills)
- 2 about actual projects/challenges they faced  
- 2 scenario-based (relevant to {field})
- 1 about their growth/learning approach

Make each question feel different - vary length, tone, and structure. Be genuinely curious.

Generate exactly {question_count} questions, numbered 1-{question_count}, nothing else:"""

        raw_segments = []
        block_reason = None
        last_error = None
        max_attempts = 3

        for attempt in range(1, max_attempts + 1):
            try:
                response = model.generate_content(
                    prompt,
                    safety_settings=safety_settings
                )
                raw_segments = _extract_gemini_text(response)
                block_reason = _get_block_reason(response)

                if raw_segments:
                    break

                print(f"⚠️ Gemini attempt {attempt} returned no usable text. Block reason: {block_reason}")
            except Exception as gen_error:
                last_error = gen_error
                print(f"⚠️ Gemini attempt {attempt} failed with error: {gen_error}")

            if attempt < max_attempts:
                time.sleep(1 * attempt)  # small backoff before retry

        if not raw_segments:
            reason_text = block_reason or last_error or "unknown"
            raise ValueError(f"Gemini returned no usable content for questions (reason: {reason_text})")

        questions_text = "\n".join(raw_segments).strip()
        
        print(f"📝 Raw questions from AI:\n{questions_text[:200]}...")
        
        questions = []
        lines = questions_text.split('\n')
        for line in lines:
            line = line.strip()
            # More flexible parsing - accept various numbering formats
            if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•') or line.startswith('*')):
                # Remove numbering, bullets, etc
                question = re.sub(r'^[\d\-•*.)\s]+', '', line).strip()
                # Remove quotes if present
                question = question.strip('"\'')
                if question and len(question) > 10:
                    questions.append(question)
        
        print(f"✅ Parsed {len(questions)} questions")
        
        # If we got too few or too many questions, trim/pad
        if len(questions) < question_count:
            # Add smart fallback questions that still feel natural
            fallback_natural = [
                f"What's the most interesting problem you've solved with {skills[0] if skills else 'your tech stack'}?",
                f"I'm curious about your {field.lower()} background - what got you into it?",
                f"When working with {skills[1] if len(skills) > 1 else 'databases'}, what's your go-to approach for optimization?",
                f"You've got {level.lower()} experience - what's one thing you'd tell your past self when starting out?",
                "If you had to pick one technology to master deeply, what would it be and why?",
                f"Looking at {field.lower()} trends, what excites you most about where the field is heading?",
                "What's a technical decision you made that you'd do differently now?",
                f"How do you stay current with {skills[2] if len(skills) > 2 else 'new technologies'}?"
            ]
            random.shuffle(fallback_natural)
            questions.extend(fallback_natural[:question_count - len(questions)])
        
        return questions[:question_count]
    
    except Exception as e:
        print(f"❌ Error generating questions: {e}")
        import traceback
        traceback.print_exc()
        
        # Natural-sounding fallback questions
        fallback = [
            f"What draws you to {field}? What made you choose this path?",
            f"I see {skills[0] if skills else 'programming'} on your resume - what's your favorite aspect of working with it?",
            f"Tell me about a project where things didn't go as planned. How'd you handle it?",
            f"When you're learning something new in {field.lower()}, what's your process?",
            f"You've worked with {skills[1] if len(skills) > 1 else 'various technologies'} - which one surprised you the most?",
            "What's a technical challenge you're proud of overcoming?",
            f"If you could improve one thing about your current {field.lower()} skills, what would it be?",
            "Where do you see yourself going in the next few years?"
        ]
        return fallback[:question_count]

@app.route('/api/analyze-resume', methods=['POST'])
def analyze_resume():
    """Main endpoint to analyze resume"""
    try:
        if 'resume' not in request.files:
            return jsonify({"error": "No resume file provided"}), 400
        
        file = request.files['resume']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({"error": "Only PDF files are supported"}), 400
        
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        
        print(f"✅ File saved: {file_path}")
        
        resume_text = extract_text_from_pdf(file_path)
        
        if not resume_text:
            return jsonify({"error": "Failed to extract text from PDF"}), 500
        
        print(f"✅ Text extracted: {len(resume_text)} characters")
        
        name = extract_name(resume_text)
        email = extract_email(resume_text)
        phone = extract_phone(resume_text)
        num_pages = count_pages(file_path)
        
        print(f"✅ Basic info extracted - Name: {name}, Email: {email}")
        
        if num_pages == 1:
            cand_level = "Fresher"
        elif num_pages == 2:
            cand_level = "Intermediate"
        else:
            cand_level = "Experienced"
        
        skills = extract_skills(resume_text)
        print(f"✅ Skills found: {len(skills)}")
        
        recommended_skills, reco_field, courses = analyze_skills(skills, resume_text)
        resume_score, tips = calculate_resume_score(resume_text)

        requested_questions = request.form.get('num_questions') or request.args.get('num_questions')
        question_count = NUM_QUESTIONS
        if requested_questions is not None:
            try:
                question_count = int(requested_questions)
            except (TypeError, ValueError):
                question_count = NUM_QUESTIONS
        question_count = max(1, min(12, question_count))
        
        print(f"🤖 Generating {question_count} personalized interview questions...")
        print(f"📊 Context: {len(skills)} skills detected, {reco_field} field, {cand_level} level")
        print(f"📄 Resume length: {len(resume_text)} characters")
        
        questions = generate_interview_questions(
            skills,
            reco_field,
            cand_level,
            resume_text,
            name,
            email,
            question_count=question_count
        )
        print(f"✅ Generated {len(questions)} personalized questions")
        
        if questions:
            print(f"📝 Sample question: {questions[0][:100]}...")
        
        print(f"✅ Analysis complete - Score: {resume_score}, Field: {reco_field}")
        
        response = {
            "name": name,
            "email": email,
            "phone": phone,
            "pages": num_pages,
            "level": cand_level,
            "skills": skills,
            "recommendedSkills": recommended_skills,
            "recommendedField": reco_field,
            "resumeScore": resume_score,
            "tips": tips,
            "courses": courses,
            "interviewQuestions": questions,
            "questionCount": question_count
        }
        
        return jsonify(response), 200
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/create-session', methods=['POST'])
def create_session():
    """Create a new interview session"""
    try:
        data = request.json
        session_id = str(uuid.uuid4())
        
        print(f"📝 Creating session with data: {data}")
        
        if db_cursor and db_connection:
            insert_sql = """
            INSERT INTO interview_sessions (session_id, user_name, user_email, resume_field, experience_level)
            VALUES (%s, %s, %s, %s, %s)
            """
            values = (
                session_id,
                data.get('name', 'Anonymous'),
                data.get('email', 'N/A'),
                data.get('field', 'General'),
                data.get('level', 'Intermediate')
            )
            db_cursor.execute(insert_sql, values)
            db_connection.commit()
            
            print(f"✅ Created session: {session_id}")
            return jsonify({"session_id": session_id, "success": True}), 200
        else:
            print("❌ Database not available")
            return jsonify({"error": "Database not available"}), 500
            
    except Exception as e:
        print(f"❌ Error creating session: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/save-answer', methods=['POST'])
def save_answer():
    """Save interview answer to database with sentiment and emotion data"""
    try:
        import json
        
        session_id = request.form.get('session_id')
        question_number = request.form.get('question_number')
        question_text = request.form.get('question_text')
        answer_text = request.form.get('answer_text')
        feedback_score = request.form.get('feedback_score')
        feedback_good = request.form.get('feedback_good')
        feedback_improve = request.form.get('feedback_improve')
        
        # Get sentiment and emotion data
        content_score = request.form.get('content_score')
        sentiment_score = request.form.get('sentiment_score')
        emotion_score = request.form.get('emotion_score')
        sentiment_data_json = request.form.get('sentiment_data')
        emotion_data_json = request.form.get('emotion_data')
        
        print(f"📥 Received save request - Session: {session_id}, Q: {question_number}")
        
        if db_cursor and db_connection:
            check_sql = "SELECT session_id FROM interview_sessions WHERE session_id = %s"
            db_cursor.execute(check_sql, (session_id,))
            session_exists = db_cursor.fetchone()
            
            if not session_exists:
                print(f"❌ Session not found: {session_id}")
                return jsonify({"error": "Session not found. Please create a new session."}), 404
        
        audio_filename = None
        if 'audio' in request.files:
            audio_file = request.files['audio']
            if audio_file and audio_file.filename:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                audio_filename = f"{session_id}_q{question_number}_{timestamp}.webm"
                audio_path = os.path.join(AUDIO_FOLDER, audio_filename)
                audio_file.save(audio_path)
                print(f"💾 Saved audio: {audio_filename}")
        
        if db_cursor and db_connection:
            # Check if columns exist, if not use basic insert
            try:
                insert_sql = """
                INSERT INTO interview_answers 
                (session_id, question_number, question_text, answer_text, audio_filename, 
                 feedback_score, feedback_good, feedback_improve,
                 content_score, sentiment_score, emotion_score, sentiment_data, emotion_data)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                values = (
                    session_id,
                    int(question_number),
                    question_text,
                    answer_text or '',
                    audio_filename,
                    float(feedback_score) if feedback_score else None,
                    feedback_good,
                    feedback_improve,
                    float(content_score) if content_score else None,
                    float(sentiment_score) if sentiment_score else None,
                    float(emotion_score) if emotion_score else None,
                    sentiment_data_json if sentiment_data_json else None,
                    emotion_data_json if emotion_data_json else None
                )
                db_cursor.execute(insert_sql, values)
            except Exception as e:
                # Fallback to basic insert if new columns don't exist
                print(f"⚠️ Using basic insert (new columns may not exist): {e}")
                insert_sql = """
                INSERT INTO interview_answers 
                (session_id, question_number, question_text, answer_text, audio_filename, 
                 feedback_score, feedback_good, feedback_improve)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """
                values = (
                    session_id,
                    int(question_number),
                    question_text,
                    answer_text or '',
                    audio_filename,
                    float(feedback_score) if feedback_score else None,
                    feedback_good,
                    feedback_improve
                )
                db_cursor.execute(insert_sql, values)
            
            db_connection.commit()
            
            print(f"✅ Saved answer for Q{question_number} in session {session_id}")
            
            return jsonify({
                "success": True,
                "message": "Answer saved successfully",
                "question_number": question_number
            }), 200
        else:
            return jsonify({"error": "Database not available"}), 500
            
    except Exception as e:
        print(f"❌ Error saving answer: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/get-session-report/<session_id>', methods=['GET'])
def get_session_report(session_id):
    """Get complete interview report for a session"""
    try:
        import json
        if db_cursor and db_connection:
            # Get session info
            session_query = """
            SELECT user_name, user_email, resume_field, experience_level, created_at
            FROM interview_sessions
            WHERE session_id = %s
            """
            db_cursor.execute(session_query, (session_id,))
            session_result = db_cursor.fetchone()
            
            if not session_result:
                return jsonify({"error": "Session not found"}), 404
            
            # Get all answers with feedback (try to include new columns)
            import json
            try:
                answers_query = """
                SELECT question_number, question_text, answer_text, 
                       feedback_score, feedback_good, feedback_improve,
                       content_score, sentiment_score, emotion_score,
                       sentiment_data, emotion_data, answered_at
                FROM interview_answers
                WHERE session_id = %s
                ORDER BY question_number
                """
                db_cursor.execute(answers_query, (session_id,))
                answers_results = db_cursor.fetchall()
                has_new_columns = True
            except:
                # Fallback to basic query if new columns don't exist
                answers_query = """
                SELECT question_number, question_text, answer_text, 
                       feedback_score, feedback_good, feedback_improve, answered_at
                FROM interview_answers
                WHERE session_id = %s
                ORDER BY question_number
                """
                db_cursor.execute(answers_query, (session_id,))
                answers_results = db_cursor.fetchall()
                has_new_columns = False
            
            # Build response
            answers = []
            total_score = 0
            scored_answers = 0
            
            for row in answers_results:
                if has_new_columns and len(row) >= 12:
                    answer_data = {
                        "question_number": row[0],
                        "question": row[1],
                        "answer": row[2],
                        "feedback_score": row[3],
                        "feedback_good": row[4],
                        "feedback_improve": row[5],
                        "content_score": float(row[6]) if row[6] is not None else None,
                        "sentiment_score": float(row[7]) if row[7] is not None else None,
                        "emotion_score": float(row[8]) if row[8] is not None else None,
                        "sentiment_data": json.loads(row[9]) if row[9] and isinstance(row[9], str) else (row[9] if row[9] else None),
                        "emotion_data": json.loads(row[10]) if row[10] and isinstance(row[10], str) else (row[10] if row[10] else None),
                        "answered_at": str(row[11])
                    }
                else:
                    answer_data = {
                        "question_number": row[0],
                        "question": row[1],
                        "answer": row[2],
                        "feedback_score": row[3],
                        "feedback_good": row[4],
                        "feedback_improve": row[5],
                        "answered_at": str(row[6])
                    }
                answers.append(answer_data)
                
                if row[3] is not None:
                    total_score += row[3]
                    scored_answers += 1
            
            average_score = round(total_score / scored_answers, 1) if scored_answers > 0 else 0
            
            report = {
                "session_id": session_id,
                "user_name": session_result[0],
                "user_email": session_result[1],
                "field": session_result[2],
                "level": session_result[3],
                "interview_date": str(session_result[4]),
                "answers": answers,
                "total_questions": len(answers),
                "average_score": average_score,
                "total_score": total_score,
                "max_possible_score": scored_answers * 10
            }
            
            return jsonify(report), 200
        else:
            return jsonify({"error": "Database not available"}), 500
            
    except Exception as e:
        print(f"❌ Error fetching report: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/get-session-answers/<session_id>', methods=['GET'])
def get_session_answers(session_id):
    """Get all answers for a session"""
    try:
        if db_cursor:
            query = """
            SELECT question_number, question_text, answer_text, answered_at
            FROM interview_answers
            WHERE session_id = %s
            ORDER BY question_number
            """
            db_cursor.execute(query, (session_id,))
            results = db_cursor.fetchall()
            
            answers = []
            for row in results:
                answers.append({
                    "question_number": row[0],
                    "question_text": row[1],
                    "answer_text": row[2],
                    "answered_at": str(row[3])
                })
            
            return jsonify({"answers": answers, "total": len(answers)}), 200
        else:
            return jsonify({"error": "Database not available"}), 500
            
    except Exception as e:
        print(f"❌ Error fetching answers: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyze-answer', methods=['POST'])
def analyze_answer():
    """Analyze interview answer using Gemini AI + Sentiment + Emotion"""
    try:
        data = request.json
        question = data.get('question', '')
        answer = data.get('answer', '')
        field = data.get('field', 'General')
        level = data.get('level', 'Intermediate')
        video_frames = data.get('video_frames', [])  # List of base64 encoded frames
        
        print(f"🤖 Analyzing answer for: {question[:50]}...")
        
        if not answer or not answer.strip():
            return jsonify({"error": "No answer provided"}), 400
        
        # 1. Analyze sentiment from text
        print("📊 Analyzing sentiment...")
        sentiment_data = sentiment_analyzer.analyze_sentiment(answer)
        # Debug: Print sentiment analysis
        print(f"📊 Sentiment state: {sentiment_data.get('emotional_state', 'unknown')}")
        print(f"📊 Confidence: {sentiment_data.get('confidence_score', 0)}")
        print(f"📊 Nervousness: {sentiment_data.get('nervousness_score', 0)}")
        
        # 2. Analyze facial expressions from video frames
        print("😊 Analyzing facial expressions...")
        print(f"📹 Received {len(video_frames) if video_frames else 0} video frames")
        emotion_data = {}
        if video_frames and len(video_frames) > 0:
            emotion_data = emotion_analyzer.analyze_video_frames(video_frames)
            # Debug: Print detected emotions
            print(f"📊 Detected emotions: {emotion_data.get('emotions', {})}")
            print(f"📊 Dominant emotion: {emotion_data.get('dominant_emotion', 'unknown')}")
            print(f"📊 Interview state: {emotion_data.get('interview_state', 'unknown')}")
            print(f"📊 Detection method: {emotion_data.get('detection_method', 'unknown')}")
            print(f"📊 Frames analyzed: {emotion_data.get('frames_analyzed', 0)}")
            
            # Check if we got default/neutral (might indicate detection failure)
            if emotion_data.get('interview_state') == 'neutral' and emotion_data.get('dominant_emotion') == 'neutral':
                print("⚠️ WARNING: Got neutral state - emotion detection might have failed!")
                print("⚠️ Check if DeepFace/FER is working properly")
        else:
            emotion_data = emotion_analyzer._default_emotion()
            print("⚠️ No video frames provided for emotion analysis - using default")
        
        # 3. Get content-based score from Gemini AI
        print("🧠 Analyzing content with AI...")
        prompt = f"""You are an expert technical interviewer analyzing a candidate's answer.

QUESTION ASKED:
{question}

CANDIDATE'S ANSWER:
{answer}

CANDIDATE INFO:
- Field: {field}
- Level: {level}

YOUR TASK:
Analyze this answer and provide BRIEF feedback in exactly this format:

SCORE: [number 1-10]
GOOD: [One short sentence about what was good]
IMPROVE: [One short sentence about what could be better]

Keep it very concise - max 15 words per point.

Example:
SCORE: 7
GOOD: Clear explanation of core concepts with practical examples
IMPROVE: Could mention performance optimization and edge cases

Now analyze the answer above:"""

        # Get AI analysis
        response = model.generate_content(
        prompt,
        safety_settings=safety_settings
        )
        feedback_text = response.text.strip()
        
        print(f"✅ Feedback generated: {feedback_text[:100]}...")
        
        # Parse the response
        content_score = 5  # Default
        good_points = "Good answer"
        improve_points = "Keep practicing"
        
        lines = feedback_text.split('\n')
        for line in lines:
            line = line.strip()
            if line.startswith('SCORE:'):
                try:
                    content_score = int(re.findall(r'\d+', line)[0])
                    content_score = max(1, min(10, content_score))  # Clamp between 1-10
                except:
                    content_score = 5
            elif line.startswith('GOOD:'):
                good_points = line.replace('GOOD:', '').strip()
            elif line.startswith('IMPROVE:'):
                improve_points = line.replace('IMPROVE:', '').strip()
        
        # 4. Calculate combined score
        combined_score_data = calculate_combined_score(
            content_score,
            sentiment_data,
            emotion_data
        )
        
        final_score = combined_score_data['final_score']
        
        # Enhance feedback with sentiment/emotion insights
        sentiment_insight = ""
        emotion_insight = ""
        
        if sentiment_data.get('emotional_state') == 'nervous':
            sentiment_insight = " Consider speaking more confidently and reducing filler words."
        elif sentiment_data.get('emotional_state') == 'hesitant':
            sentiment_insight = " Try to be more decisive in your responses."
        elif sentiment_data.get('emotional_state') == 'confident':
            sentiment_insight = " Great confidence in your delivery!"
        
        if emotion_data.get('interview_state') == 'nervous':
            emotion_insight = " Your facial expressions suggest some nervousness - try to relax and maintain eye contact."
        elif emotion_data.get('interview_state') == 'confident':
            emotion_insight = " Your confident demeanor comes through well!"
        
        # Combine improve feedback
        if sentiment_insight or emotion_insight:
            improve_points = improve_points + sentiment_insight + emotion_insight
        
        result = {
            "score": final_score,
            "content_score": content_score,
            "sentiment_score": combined_score_data['sentiment_score'],
            "emotion_score": combined_score_data['emotion_score'],
            "good": good_points,
            "improve": improve_points,
            "success": True,
            "sentiment_data": sentiment_data,
            "emotion_data": emotion_data,
            "score_breakdown": {
                "content": combined_score_data['content_score'],
                "sentiment": combined_score_data['sentiment_score'],
                "emotion": combined_score_data['emotion_score'],
                "weights": combined_score_data.get('weights', {'content': 0.6, 'sentiment': 0.25, 'emotion': 0.15})
            }
        }
        
        print(f"📊 Final Score: {final_score}/10 (Content: {content_score}, Sentiment: {combined_score_data['sentiment_score']}, Emotion: {combined_score_data['emotion_score']})")
        return jsonify(result), 200
        
    except Exception as e:
        print(f"❌ Error analyzing answer: {e}")
        import traceback
        traceback.print_exc()
        # Return neutral feedback on error
        return jsonify({
            "score": 5,
            "content_score": 5,
            "sentiment_score": 5,
            "emotion_score": 5,
            "good": "Answer recorded successfully",
            "improve": "Focus on providing more specific details",
            "success": True
        }), 200

@app.route('/api/analyze-facial-expressions', methods=['POST'])
def analyze_facial_expressions():
    """Analyze facial expressions from video frames"""
    try:
        data = request.json
        frames = data.get('frames', [])  # List of base64 encoded images
        
        if not frames:
            return jsonify({"error": "No frames provided"}), 400
        
        print(f"😊 Analyzing {len(frames)} video frames...")
        
        emotion_data = emotion_analyzer.analyze_video_frames(frames)
        
        return jsonify({
            "success": True,
            "emotion_data": emotion_data
        }), 200
        
    except Exception as e:
        print(f"❌ Error analyzing facial expressions: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e),
            "emotion_data": emotion_analyzer._default_emotion()
        }), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy", 
        "message": "Flask API is running with Gemini AI, Sentiment & Emotion Analysis",
        "features": {
            "sentiment_analysis": TEXTBLOB_AVAILABLE or VADER_AVAILABLE,
            "facial_recognition": OPENCV_AVAILABLE
        }
    }), 200

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Flask API Server Starting with Gemini AI...")
    print("=" * 60)
    print("📍 Server running on: http://localhost:5000")
    print("🔗 Resume Analysis: http://localhost:5000/api/analyze-resume")
    print("🤖 AI-Powered Interview Questions: Enabled")
    print("💾 Session Management: Enabled")
    print("🏥 Health check: http://localhost:5000/api/health")
    print("=" * 60)
    app.run(debug=False, use_reloader=False, port=5000, host='0.0.0.0')