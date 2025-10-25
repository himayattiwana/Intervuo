import React from 'react'

export default function FeedbackPanel({ 
  feedback, 
  loading, 
  onContinue,
  questionNumber 
}) {
  
  if (!loading && !feedback) {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      right: 20,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 350,
      maxHeight: '80vh',
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      padding: 25,
      boxSizing: 'border-box',
      zIndex: 1000,
      animation: 'slideIn 0.3s ease-out'
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
          <h3 style={{ margin: '0 0 10px 0', fontSize: 18, color: '#333' }}>
            Analyzing Your Answer...
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
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
            borderBottom: '2px solid #f0f0f0'
          }}>
            <h3 style={{ margin: 0, fontSize: 18, color: '#333' }}>
              📊 Answer Feedback
            </h3>
            <span style={{ fontSize: 12, color: '#999', fontWeight: 600 }}>
              Q{questionNumber}
            </span>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '20px 0',
            marginBottom: 20,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 12,
            color: '#fff'
          }}>
            <div style={{ fontSize: 42, fontWeight: 'bold', marginBottom: 5 }}>
              {feedback.score}/10
            </div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>
              {feedback.score >= 8 ? 'Excellent!' : 
               feedback.score >= 6 ? 'Good Job!' : 
               feedback.score >= 4 ? 'Fair' : 'Needs Work'}
            </div>
          </div>

          <div style={{
            marginBottom: 15,
            padding: 15,
            background: '#e8f5e9',
            borderRadius: 8,
            borderLeft: '4px solid #4CAF50'
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#2e7d32',
              marginBottom: 8
            }}>
              ✅ What Was Good
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#1b5e20' }}>
              {feedback.good}
            </p>
          </div>

          <div style={{
            marginBottom: 20,
            padding: 15,
            background: '#fff3e0',
            borderRadius: 8,
            borderLeft: '4px solid #FF9800'
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#e65100',
              marginBottom: 8
            }}>
              ⚠️ Room for Improvement
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#e65100' }}>
              {feedback.improve}
            </p>
          </div>

          <button
            onClick={onContinue}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Continue to Next Question →
          </button>
        </div>
      )}
    </div>
  )
}