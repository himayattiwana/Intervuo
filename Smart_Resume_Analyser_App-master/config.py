# Google Gemini API Configuration
import os

# Get API key from environment variable (set in Render dashboard)
# Fallback to empty string if not set (will cause error, which is intentional for security)
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

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