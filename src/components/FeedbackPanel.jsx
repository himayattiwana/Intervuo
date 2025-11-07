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
    <div style={{
      position: 'fixed',
      right: 20,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 350,
      maxHeight: '80vh',
      background: theme.bgCard,
      borderRadius: 16,
      boxShadow: `0 8px 32px ${theme.shadow}`,
      padding: 25,
      boxSizing: 'border-box',
      zIndex: 1000,
      animation: 'slideIn 0.3s ease-out',
      border: `1px solid ${theme.border}`,
      backdropFilter: 'blur(20px)'
    }}>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(-50%) translateX(100px);
            opacity: 0;
          }
          to {
            transform: translateY(-50%) translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{
            fontSize: 48,
            marginBottom: 15,
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            🤖
          </div>
          <h3 style={{ 
            margin: '0 0 10px 0', 
            fontSize: 18, 
            color: theme.text,
            fontWeight: 600
          }}>
            Analyzing Your Answer...
          </h3>
          <p style={{ 
            margin: 0, 
            fontSize: 14, 
            color: theme.textSecondary
          }}>
            Our AI is reviewing your response
          </p>
        </div>
      ) : (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            paddingBottom: 15,
            borderBottom: `1px solid ${theme.border}`
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: 18, 
              color: theme.text,
              fontWeight: 700
            }}>
              📊 Answer Feedback
            </h3>
            <span style={{ 
              fontSize: 12, 
              color: theme.textTertiary, 
              fontWeight: 600,
              background: theme.bgSecondary,
              padding: '4px 10px',
              borderRadius: 12
            }}>
              Q{questionNumber}
            </span>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '24px',
            marginBottom: 20,
            background: getScoreColor(feedback.score),
            borderRadius: 16,
            color: '#fff',
            boxShadow: `0 4px 16px ${getScoreColor(feedback.score)}40`
          }}>
            <div style={{ 
              fontSize: 48, 
              fontWeight: 'bold', 
              marginBottom: 8,
              letterSpacing: '-2px'
            }}>
              {feedback.score}/10
            </div>
            <div style={{ 
              fontSize: 15, 
              opacity: 0.95,
              fontWeight: 600
            }}>
              {feedback.score >= 8 ? 'Excellent!' : 
               feedback.score >= 6 ? 'Good Job!' : 
               feedback.score >= 4 ? 'Fair' : 'Needs Work'}
            </div>
          </div>

          <div style={{
            marginBottom: 12,
            padding: 16,
            background: darkMode ? theme.success + '15' : '#E8F5E9',
            borderRadius: 12,
            borderLeft: `3px solid ${theme.success}`,
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: darkMode ? theme.success : '#2E7D32',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ✅ What Was Good
            </div>
            <p style={{ 
              margin: 0, 
              fontSize: 14, 
              lineHeight: 1.6, 
              color: darkMode ? theme.textSecondary : '#1B5E20'
            }}>
              {feedback.good}
            </p>
          </div>

          <div style={{
            marginBottom: 24,
            padding: 16,
            background: darkMode ? theme.warning + '15' : '#FFF3E0',
            borderRadius: 12,
            borderLeft: `3px solid ${theme.warning}`,
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: darkMode ? theme.warning : '#E65100',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              💡 Room for Improvement
            </div>
            <p style={{ 
              margin: 0, 
              fontSize: 14, 
              lineHeight: 1.6, 
              color: darkMode ? theme.textSecondary : '#E65100'
            }}>
              {feedback.improve}
            </p>
          </div>

          <button
            onClick={onContinue}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 12,
              border: 'none',
              background: theme.accent,
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: `0 4px 16px ${theme.shadow}`
            }}
          >
            Continue to Next Question →
          </button>
        </div>
      )}
    </div>
  )
}