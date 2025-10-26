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

  const getScoreGradient = (score) => {
    if (score >= 8) return 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)'
    if (score >= 6) return 'linear-gradient(135deg, #f1f8e9 0%, #f9fbe7 100%)'
    if (score >= 4) return 'linear-gradient(135deg, #fff3e0 0%, #fef8f1 100%)'
    return 'linear-gradient(135deg, #ffebee 0%, #fce4ec 100%)'
  }

  const getScoreBorderColor = (score) => {
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

        {/* Score Legend */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 25,
          marginBottom: 20,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: 20, color: '#333' }}>📌 Score Legend</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 15
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: '#f5f5f5',
              borderRadius: 8,
              border: '2px solid #4CAF50'
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 14
              }}>8-10</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#2e7d32' }}>Excellent</div>
                <div style={{ fontSize: 12, color: '#666' }}>Outstanding answer</div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: '#f5f5f5',
              borderRadius: 8,
              border: '2px solid #8BC34A'
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #8BC34A 0%, #AED581 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 14
              }}>6-7</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#558B2F' }}>Good</div>
                <div style={{ fontSize: 12, color: '#666' }}>Solid response</div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: '#f5f5f5',
              borderRadius: 8,
              border: '2px solid #FF9800'
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 14
              }}>4-5</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#E65100' }}>Fair</div>
                <div style={{ fontSize: 12, color: '#666' }}>Room to improve</div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: '#f5f5f5',
              borderRadius: 8,
              border: '2px solid #f44336'
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #f44336 0%, #E57373 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 14
              }}>1-3</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#C62828' }}>Needs Work</div>
                <div style={{ fontSize: 12, color: '#666' }}>Requires practice</div>
              </div>
            </div>
          </div>
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
              background: answer.feedback_score ? getScoreGradient(answer.feedback_score) : '#fff',
              borderRadius: 12,
              border: `3px solid ${answer.feedback_score ? getScoreBorderColor(answer.feedback_score) : '#e0e0e0'}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              transition: 'transform 0.2s ease',
            }}>
              {/* Question Header with Score */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start', 
                marginBottom: 20,
                paddingBottom: 15,
                borderBottom: `2px solid ${answer.feedback_score ? getScoreBorderColor(answer.feedback_score) : '#f0f0f0'}`
              }}>
                <h3 style={{ margin: 0, fontSize: 18, flex: 1, color: '#333', fontWeight: 600 }}>
                  Q{answer.question_number}: {answer.question}
                </h3>
                {answer.feedback_score ? (
                  <div style={{
                    padding: '12px 24px',
                    background: getScoreColor(answer.feedback_score),
                    color: '#fff',
                    borderRadius: 30,
                    fontWeight: 'bold',
                    fontSize: 20,
                    marginLeft: 15,
                    minWidth: 80,
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}>
                    {answer.feedback_score}/10
                  </div>
                ) : (
                  <div style={{
                    padding: '12px 24px',
                    background: '#9e9e9e',
                    color: '#fff',
                    borderRadius: 30,
                    fontWeight: 'bold',
                    fontSize: 16,
                    marginLeft: 15,
                    textAlign: 'center'
                  }}>
                    N/A
                  </div>
                )}
              </div>

              {/* Your Answer Section */}
              <div style={{
                padding: 20,
                background: '#fff',
                borderRadius: 10,
                marginBottom: 20,
                borderLeft: `4px solid ${answer.feedback_score ? getScoreColor(answer.feedback_score) : '#2196F3'}`,
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
              }}>
                <div style={{ 
                  fontSize: 13, 
                  color: '#666', 
                  marginBottom: 10, 
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Your Answer
                </div>
                <p style={{ 
                  margin: 0, 
                  lineHeight: 1.8, 
                  color: '#333',
                  fontSize: 15,
                  whiteSpace: 'pre-wrap'
                }}>
                  {answer.answer || 'No answer provided'}
                </p>
              </div>

              {/* Feedback Section */}
              {(answer.feedback_good || answer.feedback_improve) && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: answer.feedback_good && answer.feedback_improve ? '1fr 1fr' : '1fr',
                  gap: 15,
                  marginTop: 20
                }}>
                  {/* Strengths */}
                  {answer.feedback_good && (
                    <div style={{
                      padding: 20,
                      background: '#fff',
                      borderRadius: 10,
                      border: '2px solid #4CAF50',
                      boxShadow: '0 2px 8px rgba(76, 175, 80, 0.2)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 12
                      }}>
                        <span style={{ fontSize: 22 }}>✅</span>
                        <div style={{
                          fontSize: 13,
                          color: '#2e7d32',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          What Went Well
                        </div>
                      </div>
                      <p style={{ 
                        margin: 0, 
                        fontSize: 14, 
                        color: '#1b5e20', 
                        lineHeight: 1.6,
                        fontWeight: 500
                      }}>
                        {answer.feedback_good}
                      </p>
                    </div>
                  )}

                  {/* Areas for Improvement */}
                  {answer.feedback_improve && (
                    <div style={{
                      padding: 20,
                      background: '#fff',
                      borderRadius: 10,
                      border: '2px solid #FF9800',
                      boxShadow: '0 2px 8px rgba(255, 152, 0, 0.2)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 12
                      }}>
                        <span style={{ fontSize: 22 }}>💡</span>
                        <div style={{
                          fontSize: 13,
                          color: '#e65100',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Room for Improvement
                        </div>
                      </div>
                      <p style={{ 
                        margin: 0, 
                        fontSize: 14, 
                        color: '#e65100', 
                        lineHeight: 1.6,
                        fontWeight: 500
                      }}>
                        {answer.feedback_improve}
                      </p>
                    </div>
                  )}
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