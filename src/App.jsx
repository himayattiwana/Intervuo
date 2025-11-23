import Interviewer from './components/Interviewer'
import ResumeUpload from './components/ResumeUpload'
import FeedbackPanel from './components/FeedbackPanel'
import InterviewReport from './components/InterviewReport'
import Login from './components/Login'
import { useState, useEffect } from 'react'
import './App.css'

function App() {  
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState('resume')
  const [generatedQuestions, setGeneratedQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [sessionId, setSessionId] = useState(null)
  const [sessionInfo, setSessionInfo] = useState(null)
  const [answeredQuestions, setAnsweredQuestions] = useState([])
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [analyzingAnswer, setAnalyzingAnswer] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [darkMode, setDarkMode] = useState(true)

  // Theme colors
  const theme = {
    bg: darkMode ? '#000000' : '#FFFFFF',
    bgSecondary: darkMode ? '#1C1C1E' : '#F2F2F7',
    bgCard: darkMode ? '#2C2C2E' : '#FFFFFF',
    text: darkMode ? '#FFFFFF' : '#000000',
    textSecondary: darkMode ? '#EBEBF5' : '#3C3C43',
    textTertiary: darkMode ? '#EBEBF599' : '#3C3C4399',
    accent: darkMode ? '#0A84FF' : '#007AFF',
    border: darkMode ? '#38383A' : '#E5E5EA',
    success: darkMode ? '#30D158' : '#34C759',
    warning: darkMode ? '#FF9F0A' : '#FF9500',
    error: darkMode ? '#FF453A' : '#FF3B30',
    purple: darkMode ? '#BF5AF2' : '#AF52DE',
    shadow: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
  }

  useEffect(() => {
    const loggedIn = localStorage.getItem('intervuo_logged_in')
    if (loggedIn === 'true') {
      setIsLoggedIn(true)
    }
  }, [])

  const handleLogin = () => {
    setIsLoggedIn(true)
    localStorage.setItem('intervuo_logged_in', 'true')
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem('intervuo_logged_in')
    setCurrentPage('resume')
    setGeneratedQuestions([])
    setCurrentQuestionIndex(0)
    setSessionId(null)
    setSessionInfo(null)
    setAnsweredQuestions([])
    setFeedback(null)
    setShowReport(false)
  }

  const createSession = async (info) => {
    try {
      const response = await fetch('http://localhost:5000/api/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info)
      })
      const data = await response.json()
      if (data.session_id) {
        setSessionId(data.session_id)
        setSessionInfo(info)
        console.log('✅ Session created:', data.session_id)
        return data.session_id
      }
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Failed to create session. Please try again.')
      return null
    }
  }

  const saveAnswer = async (answerData) => {
    if (!sessionId) {
      console.error('No session ID available')
      alert('No active session. Please go back to Resume Analyzer and re-upload your resume.')
      return false
    }

    console.log('Saving answer for session:', sessionId)
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('session_id', sessionId)
      formData.append('question_number', currentQuestionIndex + 1)
      formData.append('question_text', getCurrentQuestion())
      formData.append('answer_text', answerData.transcript || '')
      
      if (answerData.feedback) {
        formData.append('feedback_score', answerData.feedback.score || answerData.feedback.final_score || 5)
        formData.append('feedback_good', answerData.feedback.good || '')
        formData.append('feedback_improve', answerData.feedback.improve || '')
        
        // Add sentiment and emotion scores
        if (answerData.feedback.content_score !== undefined) {
          formData.append('content_score', answerData.feedback.content_score)
        }
        if (answerData.feedback.sentiment_score !== undefined) {
          formData.append('sentiment_score', answerData.feedback.sentiment_score)
        }
        if (answerData.feedback.emotion_score !== undefined) {
          formData.append('emotion_score', answerData.feedback.emotion_score)
        }
        if (answerData.feedback.sentiment_data) {
          formData.append('sentiment_data', JSON.stringify(answerData.feedback.sentiment_data))
        }
        if (answerData.feedback.emotion_data) {
          formData.append('emotion_data', JSON.stringify(answerData.feedback.emotion_data))
        }
      }
      
      if (answerData.audioBlob) {
        formData.append('audio', answerData.audioBlob, 'recording.webm')
      }

      const response = await fetch('http://localhost:5000/api/save-answer', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Answer saved with feedback:', result)
        setAnsweredQuestions(prev => [...prev, currentQuestionIndex])
        return true
      } else {
        alert('Failed to save answer: ' + (result.error || 'Unknown error'))
        return false
      }
    } catch (error) {
      console.error('Error saving answer:', error)
      alert('Error saving answer. Please try again.')
      return false
    } finally {
      setSaving(false)
    }
  }

  const analyzeAnswer = async (answerText, questionText, videoFrames = []) => {
    setAnalyzingAnswer(true)
    setFeedback(null)
    
    try {
      const response = await fetch('http://localhost:5000/api/analyze-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          answer: answerText,
          field: sessionInfo?.field || 'General',
          level: sessionInfo?.level || 'Intermediate',
          video_frames: videoFrames || []
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setFeedback(result)
        return result
      }
    } catch (error) {
      console.error('Error analyzing answer:', error)
      setFeedback({
        score: 5,
        content_score: 5,
        sentiment_score: 5,
        emotion_score: 5,
        good: 'Answer recorded successfully',
        improve: 'Keep practicing and providing detailed responses',
        success: true
      })
    } finally {
      setAnalyzingAnswer(false)
    }
  }

  const handleFeedbackContinue = () => {
    setFeedback(null)
    
    if (currentQuestionIndex < generatedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      setShowReport(true)
    }
  }

  const onSubmitResponse = async (payload) => {
    console.log('Answer submitted:', payload)
    const videoFrames = payload.videoFrames || []
    const feedbackResult = await analyzeAnswer(payload.transcript, getCurrentQuestion(), videoFrames)
    if (feedbackResult) {
      await saveAnswer({
        ...payload,
        feedback: feedbackResult
      })
    }
  }

  const handleQuestionsGenerated = async (questions, resumeInfo) => {
    console.log('🎯 Questions generated, creating session...')
    setGeneratedQuestions(questions)
    setCurrentQuestionIndex(0)
    setAnsweredQuestions([])
    
    const newSessionId = await createSession({
      name: resumeInfo.name || 'Anonymous',
      email: resumeInfo.email || 'N/A',
      field: resumeInfo.field || 'General',
      level: resumeInfo.level || 'Intermediate'
    })
    
    if (newSessionId) {
      console.log('✅ Session ready! User can now start the interview.')
    } else {
      alert('Failed to create session. Please check if Python server is running.')
    }
  }

  const getCurrentQuestion = () => {
    if (generatedQuestions.length > 0) {
      return generatedQuestions[currentQuestionIndex]
    }
    return "Tell me about yourself"
  }

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const goToNextQuestion = () => {
    if (currentQuestionIndex < generatedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const isQuestionAnswered = (index) => {
    return answeredQuestions.includes(index)
  }

  // Show login page if not logged in
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} darkMode={darkMode} theme={theme} />
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: theme.bg,
      color: theme.text,
      transition: 'background 0.3s ease, color 0.3s ease'
    }}>
      {showReport ? (
        <InterviewReport 
          sessionId={sessionId}
          darkMode={darkMode}
          theme={theme}
          onClose={() => {
            setShowReport(false)
            setCurrentPage('resume')
            setGeneratedQuestions([])
            setCurrentQuestionIndex(0)
            setAnsweredQuestions([])
            setSessionId(null)
            setSessionInfo(null)
          }}
        />
      ) : (
        <>
          {/* Navigation Bar */}
          <nav style={{
            background: theme.bgCard,
            borderBottom: `1px solid ${theme.border}`,
            padding: '20px 30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backdropFilter: 'blur(20px)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: `0 2px 10px ${theme.shadow}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
              <h1 style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
                background: 'linear-gradient(135deg, #0A84FF 0%, #BF5AF2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-1px'
              }}>
                INTERVUO
              </h1>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setCurrentPage('resume')}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 12,
                    border: 'none',
                    background: currentPage === 'resume' ? theme.accent : 'transparent',
                    color: currentPage === 'resume' ? '#fff' : theme.textSecondary,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Resume Analyzer
                </button>
                <button
                  onClick={() => setCurrentPage('interview')}
                  disabled={generatedQuestions.length === 0}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 12,
                    border: 'none',
                    background: currentPage === 'interview' ? theme.accent : 'transparent',
                    color: currentPage === 'interview' ? '#fff' : theme.textSecondary,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: generatedQuestions.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: generatedQuestions.length === 0 ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Virtual Interviewer
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              {sessionInfo && (
                <div style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  background: darkMode ? theme.success + '20' : '#E8F5E9',
                  color: theme.success,
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1px solid ${theme.success}`
                }}>
                  Session Active
                </div>
              )}

              <button
                onClick={() => setDarkMode(!darkMode)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                  background: theme.bgSecondary,
                  color: theme.text,
                  fontSize: 18,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              <button
                onClick={handleLogout}
                style={{
                  padding: '10px 20px',
                  borderRadius: 12,
                  border: `1px solid ${theme.error}`,
                  background: 'transparent',
                  color: theme.error,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Logout
              </button>
            </div>
          </nav>

          {/* Main Content */}
          {currentPage === 'interview' ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '40px 20px',
              minHeight: 'calc(100vh - 80px)'
            }}>
              {generatedQuestions.length > 0 ? (
                <>
                  <div style={{
                    width: '100%',
                    maxWidth: 1200,
                    marginBottom: 30,
                    background: theme.bgCard,
                    borderRadius: 16,
                    padding: 24,
                    border: `1px solid ${theme.border}`,
                    boxShadow: `0 4px 16px ${theme.shadow}`
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 16
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          padding: '8px 16px',
                          borderRadius: 20,
                          background: theme.accent,
                          color: '#fff',
                          fontSize: 14,
                          fontWeight: 700
                        }}>
                          Question {currentQuestionIndex + 1} of {generatedQuestions.length}
                        </span>
                        {isQuestionAnswered(currentQuestionIndex) && (
                          <span style={{
                            padding: '8px 16px',
                            borderRadius: 20,
                            background: darkMode ? theme.success + '20' : '#E8F5E9',
                            color: theme.success,
                            fontSize: 14,
                            fontWeight: 600,
                            border: `1px solid ${theme.success}`
                          }}>
                            ✓ Answered
                          </span>
                        )}
                      </div>
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 600,
                      lineHeight: 1.5,
                      color: theme.text
                    }}>
                      {getCurrentQuestion()}
                    </p>

                    <div style={{
                      width: '100%',
                      height: 4,
                      background: theme.bgSecondary,
                      borderRadius: 2,
                      marginTop: 16,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(answeredQuestions.length / generatedQuestions.length) * 100}%`,
                        height: '100%',
                        background: theme.accent,
                        transition: 'width 0.3s ease',
                        borderRadius: 2
                      }} />
                    </div>
                  </div>

                  <Interviewer 
                    question={getCurrentQuestion()} 
                    onSubmit={onSubmitResponse}
                    saving={saving}
                    isAnswered={isQuestionAnswered(currentQuestionIndex)}
                    disabled={analyzingAnswer || feedback !== null}
                    darkMode={darkMode}
                    theme={theme}
                  />

                  {(analyzingAnswer || feedback) && (
                    <FeedbackPanel
                      feedback={feedback}
                      loading={analyzingAnswer}
                      onContinue={handleFeedbackContinue}
                      questionNumber={currentQuestionIndex + 1}
                      darkMode={darkMode}
                      theme={theme}
                    />
                  )}

                  <div style={{
                    display: 'flex',
                    gap: 12,
                    marginTop: 24,
                    width: '100%',
                    maxWidth: 400,
                    justifyContent: 'center'
                  }}>
                    <button
                      onClick={goToPreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      style={{
                        flex: 1,
                        padding: '12px 24px',
                        borderRadius: 12,
                        border: `1px solid ${theme.border}`,
                        background: theme.bgCard,
                        color: currentQuestionIndex === 0 ? theme.textTertiary : theme.text,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                        opacity: currentQuestionIndex === 0 ? 0.5 : 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ← Previous
                    </button>

                    <button
                      onClick={goToNextQuestion}
                      disabled={currentQuestionIndex === generatedQuestions.length - 1}
                      style={{
                        flex: 1,
                        padding: '12px 24px',
                        borderRadius: 12,
                        border: `1px solid ${theme.border}`,
                        background: theme.bgCard,
                        color: currentQuestionIndex === generatedQuestions.length - 1 ? theme.textTertiary : theme.text,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: currentQuestionIndex === generatedQuestions.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: currentQuestionIndex === generatedQuestions.length - 1 ? 0.5 : 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Next →
                    </button>
                  </div>

                  <div style={{
                    width: '100%',
                    maxWidth: 800,
                    marginTop: 40,
                    background: theme.bgCard,
                    borderRadius: 16,
                    padding: 24,
                    border: `1px solid ${theme.border}`,
                    boxShadow: `0 4px 16px ${theme.shadow}`
                  }}>
                    <h3 style={{
                      margin: '0 0 20px 0',
                      fontSize: 16,
                      fontWeight: 600,
                      color: theme.text
                    }}>
                      All Questions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {generatedQuestions.map((q, i) => (
                        <div
                          key={i}
                          onClick={() => setCurrentQuestionIndex(i)}
                          style={{
                            padding: '12px 16px',
                            borderRadius: 12,
                            background: i === currentQuestionIndex ? theme.accent + '20' : theme.bgSecondary,
                            border: `1px solid ${i === currentQuestionIndex ? theme.accent : 'transparent'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12
                          }}
                        >
                          {isQuestionAnswered(i) && (
                            <span style={{
                              color: theme.success,
                              fontSize: 16,
                              fontWeight: 'bold'
                            }}>
                              ✓
                            </span>
                          )}
                          <p style={{
                            margin: 0,
                            fontSize: 14,
                            color: i === currentQuestionIndex ? theme.accent : theme.textSecondary,
                            flex: 1
                          }}>
                            <strong>Q{i + 1}:</strong> {q}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  maxWidth: 500
                }}>
                  <div style={{
                    fontSize: 64,
                    marginBottom: 20
                  }}>🎤</div>
                  <h2 style={{
                    fontSize: 24,
                    fontWeight: 700,
                    margin: '0 0 12px 0',
                    color: theme.text
                  }}>
                    No Interview Active
                  </h2>
                  <p style={{
                    fontSize: 15,
                    color: theme.textSecondary,
                    margin: '0 0 24px 0',
                    lineHeight: 1.6
                  }}>
                    Upload your resume in the Resume tab to generate personalized interview questions.
                  </p>
                  <button
                    onClick={() => setCurrentPage('resume')}
                    style={{
                      padding: '12px 32px',
                      borderRadius: 12,
                      border: 'none',
                      background: theme.accent,
                      color: '#fff',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: `0 4px 16px ${theme.shadow}`
                    }}
                  >
                    Go to Resume Upload
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ResumeUpload 
              onQuestionsGenerated={handleQuestionsGenerated}
              darkMode={darkMode}
              theme={theme}
            />
          )}
        </>
      )}
    </div>
  )
}

export default App