// API Configuration
// This will use environment variable in production, or localhost in development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    ANALYZE_RESUME: `${API_BASE_URL}/api/analyze-resume`,
    CREATE_SESSION: `${API_BASE_URL}/api/create-session`,
    SAVE_ANSWER: `${API_BASE_URL}/api/save-answer`,
    ANALYZE_ANSWER: `${API_BASE_URL}/api/analyze-answer`,
    GET_SESSION_REPORT: (sessionId) => `${API_BASE_URL}/api/get-session-report/${sessionId}`
  }
};

