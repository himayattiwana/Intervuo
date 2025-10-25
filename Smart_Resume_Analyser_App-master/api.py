from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import re
from pdfminer.high_level import extract_text
import random
from Courses import ds_course, web_course, android_course, ios_course, uiux_course
import google.generativeai as genai
from config import GEMINI_API_KEY, NUM_QUESTIONS, DIFFICULTY_MAPPING, GEMINI_MODEL, TEMPERATURE
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configure Gemini AI
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel(
    GEMINI_MODEL,
    generation_config={
        "temperature": TEMPERATURE,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 2048,
    }
)

# Initialize database connection globally
db_connection = None
db_cursor = None

try:
    import pymysql
    db_connection = pymysql.connect(host='localhost', user='root', password='')
    db_cursor = db_connection.cursor()
    
    # Create database if not exists
    db_cursor.execute("CREATE DATABASE IF NOT EXISTS SRA;")
    db_connection.select_db("sra")
    
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
        answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id)
    );
    """
    db_cursor.execute(answers_table_sql)
    
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

def generate_interview_questions(skills, field, level, resume_text, name, email):
    """Generate interview questions using Google Gemini AI"""
    try:
        difficulty = DIFFICULTY_MAPPING.get(level, 'intermediate-level')
        skills_str = ", ".join(skills[:15]) if skills else "general technical skills"
        
        sections = extract_resume_sections(resume_text)
        
        prompt = f"""You are an expert technical interviewer who has CAREFULLY READ this candidate's resume. Generate exactly {NUM_QUESTIONS} HIGHLY SPECIFIC and PERSONALIZED interview questions.

CANDIDATE INFORMATION:
Name: {name}
Email: {email}
Field: {field}
Experience Level: {level} ({difficulty})

DETECTED SKILLS (use these in questions):
{skills_str}

RESUME SECTIONS - READ CAREFULLY:

PROJECTS/WORK:
{sections['projects'][:600]}

EXPERIENCE:
{sections['experience'][:600]}

SUMMARY:
{sections['summary'][:300]}

YOUR TASK:
Create {NUM_QUESTIONS} questions that prove you READ this resume. Each question must:

1. Reference SPECIFIC technologies from their skill set
2. Mention ACTUAL projects or companies if present in resume
3. Ask about REAL challenges they likely faced based on their work
4. Use their ACTUAL experience level appropriately

QUESTION DISTRIBUTION:
- 3 questions: Deep technical about their specific tech stack (mention exact technologies)
- 2 questions: About their actual projects/work experience (reference what you see)
- 2 questions: Problem-solving scenarios using their skills
- 1 question: Behavioral/leadership appropriate to their level

EXAMPLES OF GOOD PERSONALIZED QUESTIONS:
- "I see you have {skills[0] if skills else 'Python'} listed - walk me through the most complex algorithm or data structure you implemented with it"
- "You're working in {field} - describe a specific bug or performance issue you debugged recently and your approach"
- "Given your experience with {skills[1] if len(skills) > 1 else 'databases'}, how would you design a schema for [specific scenario related to their field]?"

STRICT RULES:
- NO generic questions like "tell me about yourself" or "what are your strengths"
- Every question must show you analyzed their resume
- Use actual skill names from their list
- Make questions conversational but specific
- Difficulty must match {level} level

Generate ONLY the questions numbered 1-{NUM_QUESTIONS}, nothing else:"""

        response = model.generate_content(prompt)
        questions_text = response.text.strip()
        
        questions = []
        lines = questions_text.split('\n')
        for line in lines:
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                question = re.sub(r'^[\d\-•.)\s]+', '', line).strip()
                if question:
                    questions.append(question)
        
        if len(questions) < NUM_QUESTIONS:
            fallback = [
                f"Tell me about your background in {field}",
                f"I noticed you have experience with {skills[0] if skills else 'various technologies'} - can you elaborate on a project where you used it?",
                f"What's the most challenging problem you've solved in your {field} work?",
                f"Walk me through your experience with {skills[1] if len(skills) > 1 else 'your technical stack'}",
                "Describe a time when you had to learn a new technology quickly",
                f"How do you approach debugging and troubleshooting in {skills[2] if len(skills) > 2 else 'your projects'}?",
                "Tell me about a project you're particularly proud of",
                f"Where do you see yourself growing in the {field} space?"
            ]
            questions.extend(fallback[:NUM_QUESTIONS - len(questions)])
        
        return questions[:NUM_QUESTIONS]
    
    except Exception as e:
        print(f"Error generating questions: {e}")
        fallback = [
            f"Tell me about your background in {field}",
            f"I noticed you have experience with {skills[0] if skills else 'various technologies'} - can you elaborate on a project where you used it?",
            f"What's the most challenging problem you've solved in your {field} work?",
            f"Walk me through your experience with {skills[1] if len(skills) > 1 else 'your technical stack'}",
            "Describe a time when you had to learn a new technology quickly",
            f"How do you approach debugging and troubleshooting in {skills[2] if len(skills) > 2 else 'your projects'}?",
            "Tell me about a project you're particularly proud of",
            f"Where do you see yourself growing in the {field} space?"
        ]
        return fallback[:NUM_QUESTIONS]

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
        
        print(f"🤖 Generating {NUM_QUESTIONS} personalized interview questions...")
        print(f"📊 Context: {len(skills)} skills detected, {reco_field} field, {cand_level} level")
        print(f"📄 Resume length: {len(resume_text)} characters")
        
        questions = generate_interview_questions(skills, reco_field, cand_level, resume_text, name, email)
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
            "interviewQuestions": questions
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
    """Save interview answer to database"""
    try:
        session_id = request.form.get('session_id')
        question_number = request.form.get('question_number')
        question_text = request.form.get('question_text')
        answer_text = request.form.get('answer_text')
        
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
            insert_sql = """
            INSERT INTO interview_answers 
            (session_id, question_number, question_text, answer_text, audio_filename)
            VALUES (%s, %s, %s, %s, %s)
            """
            values = (
                session_id,
                int(question_number),
                question_text,
                answer_text or '',
                audio_filename
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

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "Flask API is running with Gemini AI"}), 200

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
    app.run(debug=True, port=5000, host='0.0.0.0')