import React, { useState, useEffect } from 'react'

export default function InterviewReport({ sessionId, onClose, darkMode = true, theme = {} }) {
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
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        background: theme.bg,
        transition: 'all 0.3s ease'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: 48, 
            marginBottom: 20,
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>📊</div>
          <h2 style={{ 
            color: theme.text,
            fontSize: 24,
            fontWeight: 600
          }}>
            Generating Your Report...
          </h2>
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.7; transform: scale(1.1); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div style={{ 
        padding: 40, 
        textAlign: 'center',
        background: theme.bg,
        color: theme.text,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
          <h2>Error loading report</h2>
        </div>
      </div>
    )
  }

  const getScoreColor = (score) => {
    if (score >= 8) return theme.success
    if (score >= 6) return darkMode ? '#8BC34A' : '#7CB342'
    if (score >= 4) return theme.warning
    return theme.error
  }

  const getScoreGradient = (score) => {
    if (darkMode) {
      if (score >= 8) return `linear-gradient(135deg, ${theme.success}15 0%, ${theme.success}08 100%)`
      if (score >= 6) return 'linear-gradient(135deg, #8BC34A15 0%, #8BC34A08 100%)'
      if (score >= 4) return `linear-gradient(135deg, ${theme.warning}15 0%, ${theme.warning}08 100%)`
      return `linear-gradient(135deg, ${theme.error}15 0%, ${theme.error}08 100%)`
    } else {
      if (score >= 8) return 'linear-gradient(135deg, #E8F5E9 0%, #F1F8F4 100%)'
      if (score >= 6) return 'linear-gradient(135deg, #F1F8E9 0%, #F9FBE7 100%)'
      if (score >= 4) return 'linear-gradient(135deg, #FFF3E0 0%, #FEF8F1 100%)'
      return 'linear-gradient(135deg, #FFEBEE 0%, #FCE4EC 100%)'
    }
  }

  const getScoreBorderColor = (score) => {
    if (score >= 8) return theme.success
    if (score >= 6) return darkMode ? '#8BC34A' : '#7CB342'
    if (score >= 4) return theme.warning
    return theme.error
  }

  const getPerformanceLevel = (avg) => {
    if (avg >= 8) return { text: 'Excellent', color: theme.success, emoji: '🌟' }
    if (avg >= 6) return { text: 'Good', color: darkMode ? '#8BC34A' : '#7CB342', emoji: '👍' }
    if (avg >= 4) return { text: 'Fair', color: theme.warning, emoji: '📈' }
    return { text: 'Needs Improvement', color: theme.error, emoji: '💪' }
  }

  const performance = getPerformanceLevel(report.average_score)

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: theme.bg, 
      padding: '40px 20px',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: darkMode 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 16,
          padding: 40,
          color: '#fff',
          marginBottom: 30,
          boxShadow: `0 10px 40px ${darkMode ? 'rgba(102, 126, 234, 0.4)' : 'rgba(102, 126, 234, 0.3)'}`,
          border: darkMode ? `1px solid ${theme.border}` : 'none'
        }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: 36, fontWeight: 700 }}>
            Interview Complete! 🎉
          </h1>
          <p style={{ margin: 0, fontSize: 18, opacity: 0.9, fontWeight: 500 }}>
            {report.user_name} • {report.field} • {report.level}
          </p>
        </div>

        {/* Score Legend */}
        <div style={{
          background: theme.bgCard,
          borderRadius: 16,
          padding: 25,
          marginBottom: 20,
          boxShadow: `0 4px 20px ${theme.shadow}`,
          border: `1px solid ${theme.border}`,
          transition: 'all 0.3s ease'
        }}>
          <h3 style={{ 
            margin: '0 0 20px 0', 
            fontSize: 20, 
            color: theme.text,
            fontWeight: 700
          }}>
            📌 Score Legend
          </h3>
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
              background: theme.bgSecondary,
              borderRadius: 8,
              border: `2px solid ${theme.success}`,
              transition: 'all 0.2s ease'
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
                <div style={{ fontWeight: 600, fontSize: 14, color: theme.success }}>
                  Excellent
                </div>
                <div style={{ fontSize: 12, color: theme.textTertiary }}>
                  Outstanding answer
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: theme.bgSecondary,
              borderRadius: 8,
              border: `2px solid ${darkMode ? '#8BC34A' : '#7CB342'}`,
              transition: 'all 0.2s ease'
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
                <div style={{ 
                  fontWeight: 600, 
                  fontSize: 14, 
                  color: darkMode ? '#8BC34A' : '#558B2F' 
                }}>
                  Good
                </div>
                <div style={{ fontSize: 12, color: theme.textTertiary }}>
                  Solid response
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: theme.bgSecondary,
              borderRadius: 8,
              border: `2px solid ${theme.warning}`,
              transition: 'all 0.2s ease'
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
                <div style={{ fontWeight: 600, fontSize: 14, color: theme.warning }}>
                  Fair
                </div>
                <div style={{ fontSize: 12, color: theme.textTertiary }}>
                  Room to improve
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: theme.bgSecondary,
              borderRadius: 8,
              border: `2px solid ${theme.error}`,
              transition: 'all 0.2s ease'
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
                <div style={{ fontWeight: 600, fontSize: 14, color: theme.error }}>
                  Needs Work
                </div>
                <div style={{ fontSize: 12, color: theme.textTertiary }}>
                  Requires practice
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Performance */}
        <div style={{
          background: theme.bgCard,
          borderRadius: 16,
          padding: 40,
          marginBottom: 20,
          boxShadow: `0 4px 20px ${theme.shadow}`,
          border: `1px solid ${theme.border}`,
          transition: 'all 0.3s ease'
        }}>
          <h2 style={{ 
            margin: '0 0 30px 0', 
            fontSize: 28, 
            color: theme.text,
            fontWeight: 700
          }}>
            📊 Overall Performance
          </h2>
          
          <div style={{
            textAlign: 'center',
            padding: 40,
            background: `linear-gradient(135deg, ${performance.color}20, ${performance.color}05)`,
            borderRadius: 16,
            border: `2px solid ${performance.color}`,
            marginBottom: 25
          }}>
            <div style={{ fontSize: 60, marginBottom: 15 }}>{performance.emoji}</div>
            <div style={{
              fontSize: 72,
              fontWeight: 'bold',
              color: performance.color,
              marginBottom: 10,
              letterSpacing: '-2px'
            }}>
              {report.average_score.toFixed(1)}/10
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 600,
              color: performance.color
            }}>
              {performance.text}
            </div>
          </div>

          <div style={{
            padding: 20,
            background: darkMode 
              ? `linear-gradient(135deg, ${performance.color}15, ${performance.color}05)`
              : `linear-gradient(135deg, ${performance.color}15, ${performance.color}05)`,
            borderRadius: 12,
            borderLeft: `4px solid ${performance.color}`,
            color: theme.text
          }}>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, fontWeight: 500 }}>
              {report.average_score >= 8 && "Outstanding performance! You demonstrated strong technical knowledge and communication skills."}
              {report.average_score >= 6 && report.average_score < 8 && "Good job! You showed solid understanding with room for deeper technical insights."}
              {report.average_score >= 4 && report.average_score < 6 && "Fair attempt! Focus on providing more detailed answers with specific examples."}
              {report.average_score < 4 && "Keep practicing! Work on elaborating your answers and demonstrating deeper technical understanding."}
            </p>
          </div>
        </div>

        {/* Detailed Answers */}
        <div style={{
          background: theme.bgCard,
          borderRadius: 16,
          padding: 40,
          marginBottom: 20,
          boxShadow: `0 4px 20px ${theme.shadow}`,
          border: `1px solid ${theme.border}`,
          transition: 'all 0.3s ease'
        }}>
          <h2 style={{ 
            margin: '0 0 30px 0', 
            fontSize: 28, 
            color: theme.text,
            fontWeight: 700
          }}>
            📝 Detailed Review
          </h2>
          
          {report.answers.map((answer, index) => (
            <div key={index} style={{
              marginBottom: 30,
              padding: 25,
              background: answer.feedback_score ? getScoreGradient(answer.feedback_score) : theme.bgSecondary,
              borderRadius: 12,
              border: `3px solid ${answer.feedback_score ? getScoreBorderColor(answer.feedback_score) : theme.border}`,
              boxShadow: `0 4px 12px ${theme.shadow}`,
              transition: 'transform 0.2s ease',
            }}>
              {/* Question Header with Score */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start', 
                marginBottom: 20,
                paddingBottom: 15,
                borderBottom: `2px solid ${answer.feedback_score ? getScoreBorderColor(answer.feedback_score) : theme.border}`
              }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: 18, 
                  flex: 1, 
                  color: theme.text, 
                  fontWeight: 600 
                }}>
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
                    background: theme.border,
                    color: theme.textTertiary,
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
                background: darkMode ? theme.bgSecondary : '#FFFFFF',
                borderRadius: 10,
                marginBottom: 20,
                borderLeft: `4px solid ${answer.feedback_score ? getScoreColor(answer.feedback_score) : theme.accent}`,
                boxShadow: `0 2px 6px ${theme.shadow}`
              }}>
                <div style={{ 
                  fontSize: 13, 
                  color: theme.textTertiary, 
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
                  color: theme.text,
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
                      background: darkMode ? theme.success + '15' : '#E8F5E9',
                      borderRadius: 10,
                      border: `2px solid ${theme.success}`,
                      boxShadow: `0 2px 8px ${theme.success}40`
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
                          color: theme.success,
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
                        color: darkMode ? theme.textSecondary : '#1B5E20', 
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
                      background: darkMode ? theme.warning + '15' : '#FFF3E0',
                      borderRadius: 10,
                      border: `2px solid ${theme.warning}`,
                      boxShadow: `0 2px 8px ${theme.warning}40`
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
                          color: theme.warning,
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
                        color: darkMode ? theme.textSecondary : '#E65100', 
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
              boxShadow: `0 4px 15px ${darkMode ? 'rgba(102, 126, 234, 0.5)' : 'rgba(102, 126, 234, 0.4)'}`,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = `0 6px 20px ${darkMode ? 'rgba(102, 126, 234, 0.6)' : 'rgba(102, 126, 234, 0.5)'}`
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = `0 4px 15px ${darkMode ? 'rgba(102, 126, 234, 0.5)' : 'rgba(102, 126, 234, 0.4)'}`
            }}
          >
            Complete Session
          </button>
        </div>
      </div>
    </div>
  )
}