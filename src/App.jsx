import Interviewer from './components/Interviewer'
import ResumeUpload from './components/ResumeUpload'
import FeedbackPanel from './components/FeedbackPanel'
import InterviewReport from './components/InterviewReport'
import { useState, useEffect } from 'react'
import './App.css'

function App() {  
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
      alert('No active session. Session ID: ' + sessionId + '. Please go back to Resume Analyzer and re-upload your resume.')
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
      
      if (answerData.audioBlob) {
        formData.append('audio', answerData.audioBlob, 'recording.webm')
      }

      const response = await fetch('http://localhost:5000/api/save-answer', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Answer saved:', result)
        
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

  const analyzeAnswer = async (answerText, questionText) => {
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
          level: sessionInfo?.level || 'Intermediate'
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
      alert('🎉 Interview completed! All answers saved successfully!')
    }
  }

  const onSubmitResponse = async (payload) => {
    console.log('Answer submitted:', payload)
    
    const saved = await saveAnswer(payload)
    
    if (saved) {
      await analyzeAnswer(payload.transcript, getCurrentQuestion())
    }
  }

  const handleQuestionsGenerated = async (questions, resumeInfo) => {
    console.log('🎯 Questions generated, creating session...')
    console.log('Resume info:', resumeInfo)
    
    setGeneratedQuestions(questions)
    setCurrentQuestionIndex(0)
    setAnsweredQuestions([])
    
    const newSessionId = await createSession({
      name: resumeInfo.name || 'Anonymous',
      email: resumeInfo.email || 'N/A',
      field: resumeInfo.field || 'General',
      level: resumeInfo.level || 'Intermediate'
    })
    
    console.log('📝 Session created with ID:', newSessionId)
    console.log('Questions generated:', questions)
    
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

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Navigation Bar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        padding: '15px 20px',
        background: '#fff',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <button
          onClick={() => setCurrentPage('interviewer')}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: currentPage === 'interviewer' ? '#4CAF50' : '#e0e0e0',
            color: currentPage === 'interviewer' ? '#fff' : '#333',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          🎤 Virtual Interviewer
        </button>
        
        <button
          onClick={() => setCurrentPage('resume')}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: currentPage === 'resume' ? '#2196F3' : '#e0e0e0',
            color: currentPage === 'resume' ? '#fff' : '#333',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          📄 Resume Analyzer
        </button>

        {generatedQuestions.length > 0 && (
          <div style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: sessionId ? '#e8f5e9' : '#fff3e0',
            color: sessionId ? '#2e7d32' : '#e65100',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            {sessionId ? '✓' : '⏳'} {generatedQuestions.length} Questions | {answeredQuestions.length} Answered
            {!sessionId && <span style={{ fontSize: 12, opacity: 0.8 }}>(Preparing...)</span>}
          </div>
        )}
      </nav>

      {/* Page Content */}
      {currentPage === 'interviewer' ? (
        <div>
          <div
            style={{
              display: 'flex',          
              flexDirection: 'column', 
              justifyContent: 'center',
              alignItems: 'center', 
              minHeight: 'calc(100vh - 60px)',
              padding: 16,
              boxSizing: 'border-box',
            }}
          >
            <h1 style={{ marginBottom: 10 }}>Virtual Interviewer</h1>
            
            {generatedQuestions.length > 0 && (
              <div style={{
                marginBottom: 20,
                width: '100%',
                maxWidth: 1000
              }}>
                {/* Current Question Highlight */}
                <div style={{
                  padding: '25px 35px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 16,
                  color: '#fff',
                  boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
                  marginBottom: 15
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 15
                  }}>
                    <p style={{ margin: 0, fontSize: 14, opacity: 0.9, fontWeight: 600 }}>
                      QUESTION {currentQuestionIndex + 1} OF {generatedQuestions.length}
                    </p>
                    {isQuestionAnswered(currentQuestionIndex) && (
                      <span style={{
                        padding: '4px 12px',
                        background: '#4CAF50',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        ✓ ANSWERED
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 600, lineHeight: 1.5 }}>
                    {getCurrentQuestion()}
                  </p>
                </div>

                {/* Progress Bar */}
                <div style={{
                  width: '100%',
                  height: 8,
                  background: '#e0e0e0',
                  borderRadius: 4,
                  overflow: 'hidden',
                  marginBottom: 20
                }}>
                  <div style={{
                    width: `${((answeredQuestions.length) / generatedQuestions.length) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}

            <Interviewer 
              question={getCurrentQuestion()} 
              onSubmit={onSubmitResponse}
              saving={saving}
              isAnswered={isQuestionAnswered(currentQuestionIndex)}
              disabled={analyzingAnswer || feedback !== null}
            />

            {(analyzingAnswer || feedback) && (
              <FeedbackPanel
                feedback={feedback}
                loading={analyzingAnswer}
                onContinue={handleFeedbackContinue}
                questionNumber={currentQuestionIndex + 1}
              />
            )}

            {generatedQuestions.length > 0 && (
              <div style={{
                marginTop: 20,
                display: 'flex',
                gap: 10,
                alignItems: 'center'
              }}>
                <button
                  onClick={goToPreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: currentQuestionIndex === 0 ? '#ccc' : '#2196F3',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                    opacity: currentQuestionIndex === 0 ? 0.5 : 1
                  }}
                >
                  ← Previous
                </button>

                <span style={{
                  padding: '8px 16px',
                  background: '#f5f5f5',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600
                }}>
                  {currentQuestionIndex + 1} / {generatedQuestions.length}
                </span>

                <button
                  onClick={goToNextQuestion}
                  disabled={currentQuestionIndex === generatedQuestions.length - 1}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: currentQuestionIndex === generatedQuestions.length - 1 ? '#ccc' : '#2196F3',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: currentQuestionIndex === generatedQuestions.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: currentQuestionIndex === generatedQuestions.length - 1 ? 0.5 : 1
                  }}
                >
                  Next →
                </button>
              </div>
            )}

            {generatedQuestions.length > 0 && (
              <div style={{
                marginTop: 30,
                padding: 20,
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                maxWidth: 800,
                width: '100%'
              }}>
                <h3 style={{ marginBottom: 15, fontSize: 18, color: '#333' }}>📝 All Questions:</h3>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {generatedQuestions.map((q, i) => (
                    <div
                      key={i}
                      onClick={() => setCurrentQuestionIndex(i)}
                      style={{
                        padding: 12,
                        marginBottom: 8,
                        borderRadius: 8,
                        background: i === currentQuestionIndex ? '#e3f2fd' : '#f5f5f5',
                        cursor: 'pointer',
                        border: i === currentQuestionIndex ? '2px solid #2196F3' : '1px solid transparent',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      {isQuestionAnswered(i) && (
                        <span style={{
                          position: 'absolute',
                          right: 12,
                          top: 12,
                          color: '#4CAF50',
                          fontSize: 16,
                          fontWeight: 'bold'
                        }}>
                          ✓
                        </span>
                      )}
                      <p style={{ margin: 0, fontSize: 14, color: '#333', paddingRight: 30 }}>
                        <strong>Q{i + 1}:</strong> {q}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <ResumeUpload onQuestionsGenerated={handleQuestionsGenerated} />
      )}
    </div>
  )
}

export default App