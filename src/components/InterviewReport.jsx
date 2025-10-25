import React, { useState, useEffect } from 'react'

export default function InterviewReport({ sessionId, onClose }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReport()
  }, [sessionId])

  const fetchReport = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/get-session-report/${sessionId}`)
      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📊</div>
          <h2>Generating Your Report...</h2>
        </div>
      </div>
    )
  }

  if (!report) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Error loading report</div>
  }

  const getScoreColor = (score) => {
    if (score >= 8) return '#4CAF50'
    if (score >= 6) return '#8BC34A'
    if (score >= 4) return '#FF9800'
    return '#f44336'
  }

  const getPerformanceLevel = (avg) => {
    if (avg >= 8) return { text: 'Excellent', color: '#4CAF50', emoji: '🌟' }
    if (avg >= 6) return { text: 'Good', color: '#8BC34A', emoji: '👍' }
    if (avg >= 4) return { text: 'Fair', color: '#FF9800', emoji: '📈' }
    return { text: 'Needs Improvement', color: '#f44336', emoji: '💪' }
  }

  const performance = getPerformanceLevel(report.average_score)

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '40px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 16,
          padding: 40,
          color: '#fff',
          marginBottom: 30,
          boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)'
        }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: 36 }}>Interview Complete! 🎉</h1>
          <p style={{ margin: 0, fontSize: 18, opacity: 0.9 }}>
            {report.user_name} • {report.field} • {report.level}
          </p>
        </div>

        {/* Overall Performance */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 40,
          marginBottom: 20,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 30px 0', fontSize: 28 }}>📊 Overall Performance</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
            <div style={{ textAlign: 'center', padding: 20, background: '#f5f5f5', borderRadius: 12 }}>
              <div style={{ fontSize: 48, fontWeight: 'bold', color: performance.color }}>
                {report.average_score}/10
              </div>
              <div style={{ fontSize: 14, color: '#666', marginTop: 5 }}>Average Score</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: 20, background: '#f5f5f5', borderRadius: 12 }}>
              <div style={{ fontSize: 48, fontWeight: 'bold', color: '#2196F3' }}>
                {report.total_questions}
              </div>
              <div style={{ fontSize: 14, color: '#666', marginTop: 5 }}>Questions Answered</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: 20, background: '#f5f5f5', borderRadius: 12 }}>
              <div style={{ fontSize: 36, marginBottom: 5 }}>{performance.emoji}</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: performance.color }}>
                {performance.text}
              </div>
            </div>
          </div>

          <div style={{
            padding: 20,
            background: `linear-gradient(135deg, ${performance.color}15, ${performance.color}05)`,
            borderRadius: 12,
            borderLeft: `4px solid ${performance.color}`
          }}>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
              {report.average_score >= 8 && "Outstanding performance! You demonstrated strong technical knowledge and communication skills."}
              {report.average_score >= 6 && report.average_score < 8 && "Good job! You showed solid understanding with room for deeper technical insights."}
              {report.average_score >= 4 && report.average_score < 6 && "Fair attempt! Focus on providing more detailed answers with specific examples."}
              {report.average_score < 4 && "Keep practicing! Work on elaborating your answers and demonstrating deeper technical understanding."}
            </p>
          </div>
        </div>

        {/* Detailed Answers */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 40,
          marginBottom: 20,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 30px 0', fontSize: 28 }}>📝 Detailed Review</h2>
          
          {report.answers.map((answer, index) => (
            <div key={index} style={{
              marginBottom: 30,
              padding: 25,
              background: '#f9f9f9',
              borderRadius: 12,
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                <h3 style={{ margin: 0, fontSize: 18, flex: 1, color: '#333' }}>
                  Q{answer.question_number}: {answer.question}
                </h3>
                {answer.feedback_score && (
                  <div style={{
                    padding: '8px 16px',
                    background: getScoreColor(answer.feedback_score),
                    color: '#fff',
                    borderRadius: 20,
                    fontWeight: 'bold',
                    fontSize: 16,
                    marginLeft: 15
                  }}>
                    {answer.feedback_score}/10
                  </div>
                )}
              </div>

              <div style={{
                padding: 15,
                background: '#fff',
                borderRadius: 8,
                marginBottom: 15,
                borderLeft: '3px solid #2196F3'
              }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 5, fontWeight: 600 }}>YOUR ANSWER:</div>
                <p style={{ margin: 0, lineHeight: 1.6, color: '#333' }}>
                  {answer.answer || 'No answer provided'}
                </p>
              </div>

              {answer.feedback_good && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 8
                  }}>
                    ✅ STRENGTH
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: '#1b5e20', lineHeight: 1.5 }}>
                    {answer.feedback_good}
                  </p>
                </div>
              )}

              {answer.feedback_improve && (
                <div>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    background: '#fff3e0',
                    color: '#e65100',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 8
                  }}>
                    💡 IMPROVEMENT
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: '#e65100', lineHeight: 1.5 }}>
                    {answer.feedback_improve}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button
            onClick={onClose}
            style={{
              padding: '16px 48px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontSize: 18,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            Complete Session
          </button>
        </div>
      </div>
    </div>
  )
}