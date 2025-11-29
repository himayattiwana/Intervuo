# Google Gemini API Configuration

# Replace 'YOUR_API_KEY_HERE' with your actual Gemini API key
GEMINI_API_KEY = 'AIzaSyCkTNP7tnR5hCoZAOM_tmJNZ7oAHp37F-E'

# Gemini Model - use gemini-pro (stable and widely available)
GEMINI_MODEL = 'gemini-2.5-flash'

# Number of questions to generate per session
NUM_QUESTIONS = 2

# Question difficulty levels
DIFFICULTY_MAPPING = {
    'Fresher': 'entry-level',
    'Intermediate': 'intermediate-level',
    'Experienced': 'advanced-level'
}

# Temperature for AI creativity (0.0 = deterministic, 1.0 = creative)
# Higher value = more unique questions each time  
TEMPERATURE = 1.2  # Very high creativity for maximum uniqueness