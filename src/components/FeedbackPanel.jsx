import React from 'react'

export default function FeedbackPanel({ 
  feedback, 
  loading, 
  onContinue,
  questionNumber,
  darkMode = true,
  theme = {}
}) {
  
  if (!loading && !feedback) {
    return null
  }

  const getScoreColor = (score) => {
    if (score >= 8) return theme.success
    if (score >= 6) return darkMode ? '#8BC34A' : '#7CB342'
    if (score >= 4) return theme.warning
    return theme.error
  }

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 999,
        animation: 'fadeIn 0.3s ease-out',
        backdropFilter: 'blur(4px)'
      }} />

      {/* Centered Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: 800,
        maxHeight: '90vh',
        background: theme.bgCard,
        borderRadius: 20,
        boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`,
        padding: 40,
        boxSizing: 'border-box',
        zIndex: 1000,
        animation: 'slideUp 0.3s ease-out',
        border: `1px solid ${theme.border}`,
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from {
              transform: translate(-50%, -40%);
              opacity: 0;
            }
            to {
              transform: translate(-50%, -50%);
              opacity: 1;
            }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              fontSize: 64,
              marginBottom: 20,
              animation: 'pulse 1.5s ease-in-out infinite'
            }}>
              🤖
            </div>
            <h3 style={{ 
              margin: '0 0 15px 0', 
              fontSize: 24, 
              color: theme.text,
              fontWeight: 700
            }}>
              Analyzing Your Answer...
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: 16, 
              color: theme.textSecondary
            }}>
              Our AI is reviewing your response, tone, and expressions
            </p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 30,
              paddingBottom: 20,
              borderBottom: `2px solid ${theme.border}`
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: 28, 
                color: theme.text,
                fontWeight: 700
              }}>
                Answer Feedback
              </h2>
              <span style={{ 
                fontSize: 14, 
                color: theme.textTertiary, 
                fontWeight: 600,
                background: theme.bgSecondary,
                padding: '8px 16px',
                borderRadius: 20,
                border: `1px solid ${theme.border}`
              }}>
                Question {questionNumber}
              </span>
            </div>

            {/* Score Display */}
            <div style={{
              textAlign: 'center',
              padding: '40px',
              marginBottom: 30,
              background: getScoreColor(feedback.score),
              borderRadius: 20,
              color: '#fff',
              boxShadow: `0 8px 24px ${getScoreColor(feedback.score)}50`
            }}>
              <div style={{ 
                fontSize: 72, 
                fontWeight: 'bold', 
                marginBottom: 12,
                letterSpacing: '-4px'
              }}>
                {feedback.score}/10
              </div>
              <div style={{ 
                fontSize: 20, 
                opacity: 0.95,
                fontWeight: 600
              }}>
                {feedback.score >= 8 ? 'Excellent Performance!' : 
                 feedback.score >= 6 ? 'Good Job!' : 
                 feedback.score >= 4 ? 'Fair Attempt' : 'Keep Practicing!'}
              </div>
            </div>

            {/* Score Breakdown */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              marginBottom: 30
            }}>
              {feedback.content_score !== undefined && (
                <div style={{
                  padding: 20,
                  background: darkMode ? theme.accent + '20' : '#E3F2FD',
                  borderRadius: 16,
                  textAlign: 'center',
                  border: `2px solid ${theme.accent}`
                }}>
                  <div style={{ fontSize: 12, color: theme.textTertiary, marginBottom: 8, fontWeight: 600 }}>
                    Content
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 'bold', color: theme.accent }}>
                    {feedback.content_score}/10
                  </div>
                </div>
              )}
              {feedback.sentiment_score !== undefined && (
                <div style={{
                  padding: 20,
                  background: darkMode ? theme.purple + '20' : '#F3E5F5',
                  borderRadius: 16,
                  textAlign: 'center',
                  border: `2px solid ${theme.purple}`
                }}>
                  <div style={{ fontSize: 12, color: theme.textTertiary, marginBottom: 8, fontWeight: 600 }}>
                    Tone
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 'bold', color: theme.purple }}>
                    {feedback.sentiment_score}/10
                  </div>
                </div>
              )}
              {feedback.emotion_score !== undefined && (
                <div style={{
                  padding: 20,
                  background: darkMode ? theme.success + '20' : '#E8F5E9',
                  borderRadius: 16,
                  textAlign: 'center',
                  border: `2px solid ${theme.success}`
                }}>
                  <div style={{ fontSize: 12, color: theme.textTertiary, marginBottom: 8, fontWeight: 600 }}>
                    Expression
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 'bold', color: theme.success }}>
                    {feedback.emotion_score}/10
                  </div>
                </div>
              )}
            </div>

            {/* Feedback Sections */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 20,
              marginBottom: 30
            }}>
              {/* Strengths */}
              <div style={{
                padding: 24,
                background: darkMode ? theme.success + '15' : '#E8F5E9',
                borderRadius: 16,
                border: `2px solid ${theme.success}`,
                boxShadow: `0 4px 12px ${theme.success}30`
              }}>
                <div style={{
                  fontSize: 16,
                  color: darkMode ? theme.success : '#2E7D32',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 16
                }}>
                  What Went Well
                </div>
                <p style={{ 
                  margin: 0, 
                  fontSize: 15, 
                  lineHeight: 1.7, 
                  color: darkMode ? theme.textSecondary : '#1B5E20',
                  fontWeight: 500
                }}>
                  {feedback.good}
                </p>
              </div>

              {/* Areas for Improvement */}
              <div style={{
                padding: 24,
                background: darkMode ? theme.warning + '15' : '#FFF3E0',
                borderRadius: 16,
                border: `2px solid ${theme.warning}`,
                boxShadow: `0 4px 12px ${theme.warning}30`
              }}>
                <div style={{
                  fontSize: 16,
                  color: darkMode ? theme.warning : '#E65100',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 16
                }}>
                  Room for Improvement
                </div>
                <p style={{ 
                  margin: 0, 
                  fontSize: 15, 
                  lineHeight: 1.7, 
                  color: darkMode ? theme.textSecondary : '#E65100',
                  fontWeight: 500
                }}>
                  {feedback.improve}
                </p>
              </div>
            </div>

            {/* Sentiment & Emotion Analysis */}
            {(feedback.sentiment_data || feedback.emotion_data) && (
              <div style={{
                padding: 24,
                background: darkMode ? theme.bgSecondary : '#F9F9F9',
                borderRadius: 16,
                border: `1px solid ${theme.border}`,
                marginBottom: 30
              }}>
                <div style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: theme.text,
                  marginBottom: 20,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Detailed Analysis
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 20
                }}>
                  {/* Sentiment Details */}
                  {feedback.sentiment_data && (
                    <div style={{
                      padding: 16,
                      background: darkMode ? theme.bgCard : '#FFFFFF',
                      borderRadius: 12,
                      borderLeft: `4px solid ${theme.purple}`
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 12 }}>
                        Sentiment Analysis
                      </div>
                      <div style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.8 }}>
                        <div><strong>State:</strong> <span style={{ 
                          color: feedback.sentiment_data.emotional_state === 'confident' ? theme.success :
                                 feedback.sentiment_data.emotional_state === 'nervous' ? theme.error :
                                 feedback.sentiment_data.emotional_state === 'hesitant' ? theme.warning : theme.text
                        }}>{feedback.sentiment_data.emotional_state || 'neutral'}</span></div>
                        {feedback.sentiment_data.confidence_score !== undefined && (
                          <div><strong>Confidence:</strong> {(feedback.sentiment_data.confidence_score * 100).toFixed(0)}%</div>
                        )}
                        {feedback.sentiment_data.clarity_score !== undefined && (
                          <div><strong>Clarity:</strong> {(feedback.sentiment_data.clarity_score * 100).toFixed(0)}%</div>
                        )}
                        {feedback.sentiment_data.nervousness_score !== undefined && (
                          <div><strong>Nervousness:</strong> {(feedback.sentiment_data.nervousness_score * 100).toFixed(0)}%</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Emotion Details */}
                  {feedback.emotion_data && (
                    <div style={{
                      padding: 16,
                      background: darkMode ? theme.bgCard : '#FFFFFF',
                      borderRadius: 12,
                      borderLeft: `4px solid ${theme.success}`
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 12 }}>
                        Facial Expression
                      </div>
                      <div style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.8 }}>
                        <div><strong>State:</strong> <span style={{ 
                          color: feedback.emotion_data.interview_state === 'confident' ? theme.success :
                                 feedback.emotion_data.interview_state === 'nervous' ? theme.error :
                                 feedback.emotion_data.interview_state === 'hesitant' ? theme.warning : theme.text
                        }}>{feedback.emotion_data.interview_state || 'neutral'}</span></div>
                        {feedback.emotion_data.dominant_emotion && (
                          <div><strong>Dominant:</strong> {feedback.emotion_data.dominant_emotion}</div>
                        )}
                        {feedback.emotion_data.confidence_level && (
                          <div><strong>Detection:</strong> {feedback.emotion_data.confidence_level}</div>
                        )}
                        {feedback.emotion_data.frames_analyzed && (
                          <div><strong>Frames:</strong> {feedback.emotion_data.frames_analyzed}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Continue Button */}
            <button
              onClick={onContinue}
              style={{
                width: '100%',
                padding: '18px 32px',
                borderRadius: 16,
                border: 'none',
                background: theme.accent,
                color: '#fff',
                fontSize: 18,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: `0 8px 24px ${theme.shadow}`,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = `0 12px 32px ${theme.shadow}`
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = `0 8px 24px ${theme.shadow}`
              }}
            >
              Continue to Next Question →
            </button>
          </div>
        )}
      </div>
    </>
  )
}
