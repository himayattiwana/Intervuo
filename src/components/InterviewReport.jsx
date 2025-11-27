import React, { useState, useEffect } from 'react'

export default function InterviewReport({ sessionId, onClose, darkMode = true, theme = {} }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!sessionId) {
      setError('Session ID missing. Please restart the interview.')
      setReport(null)
      setLoading(false)
      return
    }
    fetchReport()
  }, [sessionId])

  const fetchReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`http://localhost:5000/api/get-session-report/${sessionId}`)
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load interview report.')
      }
      if (!data || !data.answers) {
        throw new Error('Report data is incomplete. Please try again.')
      }
      setReport(data)
    } catch (error) {
      console.error('Error fetching report:', error)
      setReport(null)
      setError(error.message || 'Unable to load report.')
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

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        padding: 40,
        background: theme.bg,
        color: theme.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: 500, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
          <h2 style={{ marginBottom: 10 }}>Unable to load report</h2>
          <p style={{ color: theme.textSecondary, marginBottom: 30 }}>{error}</p>
          <button
            onClick={onClose}
            style={{
              padding: '12px 32px',
              borderRadius: 10,
              border: 'none',
              background: theme.accent,
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Return to dashboard
          </button>
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

  const parseScore = (value, fallback = 0) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const averageScore = parseScore(report.average_score)

  const getScoreColor = (score) => {
    const safeScore = parseScore(score)
    if (safeScore >= 8) return theme.success
    if (safeScore >= 6) return darkMode ? '#8BC34A' : '#7CB342'
    if (safeScore >= 4) return theme.warning
    return theme.error
  }

  const getScoreGradient = (score) => {
    const safeScore = parseScore(score)
    if (darkMode) {
      if (safeScore >= 8) return `linear-gradient(135deg, ${theme.success}15 0%, ${theme.success}08 100%)`
      if (safeScore >= 6) return 'linear-gradient(135deg, #8BC34A15 0%, #8BC34A08 100%)'
      if (safeScore >= 4) return `linear-gradient(135deg, ${theme.warning}15 0%, ${theme.warning}08 100%)`
      return `linear-gradient(135deg, ${theme.error}15 0%, ${theme.error}08 100%)`
    } else {
      if (safeScore >= 8) return 'linear-gradient(135deg, #E8F5E9 0%, #F1F8F4 100%)'
      if (safeScore >= 6) return 'linear-gradient(135deg, #F1F8E9 0%, #F9FBE7 100%)'
      if (safeScore >= 4) return 'linear-gradient(135deg, #FFF3E0 0%, #FEF8F1 100%)'
      return 'linear-gradient(135deg, #FFEBEE 0%, #FCE4EC 100%)'
    }
  }

  const getScoreBorderColor = (score) => {
    const safeScore = parseScore(score)
    if (safeScore >= 8) return theme.success
    if (safeScore >= 6) return darkMode ? '#8BC34A' : '#7CB342'
    if (safeScore >= 4) return theme.warning
    return theme.error
  }

  const getPerformanceLevel = (avg) => {
    const safeAvg = parseScore(avg)
    if (safeAvg >= 8) return { text: 'Excellent', color: theme.success, emoji: '🌟' }
    if (safeAvg >= 6) return { text: 'Good', color: darkMode ? '#8BC34A' : '#7CB342', emoji: '👍' }
    if (safeAvg >= 4) return { text: 'Fair', color: theme.warning, emoji: '📈' }
    return { text: 'Needs Improvement', color: theme.error, emoji: '💪' }
  }

  const performance = getPerformanceLevel(averageScore)
  const highContrastText = darkMode ? '#F5F5F5' : '#111'
  const feedbackColors = {
    successBg: darkMode ? '#12311F' : '#E8F5E9',
    successBorder: '#34C759',
    warningBg: darkMode ? '#2D1B0A' : '#FFF3E0',
    warningBorder: '#FFB74D',
    contentBg: darkMode ? '#2A2418' : '#FFF6E0',
    contentBorder: '#E4C472',
    toneBg: darkMode ? '#182422' : '#E0F2F1',
    toneBorder: '#26A69A',
    expressionBg: darkMode ? '#20261C' : '#E8F5E9',
    expressionBorder: '#7CB342'
  }

  const getTintBackground = (color, lightFallback) => {
    if (!color) return theme.bgSecondary
    if (lightFallback) {
      return darkMode ? `${color}26` : lightFallback
    }
    return darkMode ? `${color}26` : `${color}14`
  }

  const legendStyles = {
    excellent: {
      chip: '#4CAF50',
      bg: darkMode ? '#1e2a1f' : '#E8F5E9',
      border: '#34C759',
      text: darkMode ? '#C6F6D5' : '#1E4620'
    },
    good: {
      chip: '#8BC34A',
      bg: darkMode ? '#232b1f' : '#F1F8E9',
      border: '#7CB342',
      text: darkMode ? '#D5F5C3' : '#2E7D32'
    },
    fair: {
      chip: '#FF9800',
      bg: darkMode ? '#2b241a' : '#FFF3E0',
      border: '#FFB74D',
      text: darkMode ? '#FFD89A' : '#E65100'
    },
    needsWork: {
      chip: '#f44336',
      bg: darkMode ? '#2b1e1d' : '#FFEBEE',
      border: '#FF7961',
      text: darkMode ? '#FFBDB4' : '#B71C1C'
    }
  }

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
          background: theme.primaryGradient,
          borderRadius: 16,
          padding: 40,
          color: '#fff',
          marginBottom: 30,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
          border: darkMode ? `1px solid ${theme.border}` : 'none'
        }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: 36, fontWeight: 700 }}>
            Interview Complete!
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
            Score Legend
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 15
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 16,
              background: legendStyles.excellent.bg,
              borderRadius: 12,
              border: `2px solid ${legendStyles.excellent.border}`,
              transition: 'all 0.2s ease',
              color: legendStyles.excellent.text
            }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: legendStyles.excellent.chip,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 18,
                boxShadow: '0 6px 18px rgba(76,174,80,0.45)'
              }}>8-10</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: legendStyles.excellent.chip }}>
                  Excellent
                </div>
                <div style={{ fontSize: 14, color: legendStyles.excellent.text }}>
                  Outstanding answer
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 16,
              background: legendStyles.good.bg,
              borderRadius: 12,
              border: `2px solid ${legendStyles.good.border}`,
              transition: 'all 0.2s ease',
              color: legendStyles.good.text
            }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: legendStyles.good.chip,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 18,
                boxShadow: '0 6px 18px rgba(139,195,74,0.4)'
              }}>6-7</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: legendStyles.good.chip }}>
                  Good
                </div>
                <div style={{ fontSize: 14, color: legendStyles.good.text }}>
                  Solid response
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 16,
              background: legendStyles.fair.bg,
              borderRadius: 12,
              border: `2px solid ${legendStyles.fair.border}`,
              transition: 'all 0.2s ease',
              color: legendStyles.fair.text
            }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: legendStyles.fair.chip,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 18,
                boxShadow: '0 6px 18px rgba(255,152,0,0.45)'
              }}>4-5</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: legendStyles.fair.chip }}>
                  Fair
                </div>
                <div style={{ fontSize: 14, color: legendStyles.fair.text }}>
                  Room to improve
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 16,
              background: legendStyles.needsWork.bg,
              borderRadius: 12,
              border: `2px solid ${legendStyles.needsWork.border}`,
              transition: 'all 0.2s ease',
              color: legendStyles.needsWork.text
            }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: legendStyles.needsWork.chip,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 18,
                boxShadow: '0 6px 18px rgba(244,67,54,0.45)'
              }}>1-3</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: legendStyles.needsWork.chip }}>
                  Needs Work
                </div>
                <div style={{ fontSize: 14, color: legendStyles.needsWork.text }}>
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
            Overall Performance
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
              {averageScore.toFixed(1)}/10
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
              {averageScore >= 8 && "Outstanding performance! You demonstrated strong technical knowledge and communication skills."}
              {averageScore >= 6 && averageScore < 8 && "Good job! You showed solid understanding with room for deeper technical insights."}
              {averageScore >= 4 && averageScore < 6 && "Fair attempt! Focus on providing more detailed answers with specific examples."}
              {averageScore < 4 && "Keep practicing! Work on elaborating your answers and demonstrating deeper technical understanding."}
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
            Detailed Review
          </h2>
          
          {report.answers.map((answer, index) => (
            <div key={index} style={{
              marginBottom: 30,
              padding: 25,
              background: theme.bgSecondary,
              borderRadius: 12,
              border: `1px solid ${theme.border}`,
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
                borderBottom: `1px solid ${theme.border}`
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
                background: feedbackColors.successBg,
                borderRadius: 10,
                border: `2px solid ${feedbackColors.successBorder}`,
                boxShadow: '0 6px 16px rgba(52,199,89,0.25)'
              }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: 12
                      }}>
                        <div style={{
                          fontSize: 13,
                          color: '#7CDA91',
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
                        color: darkMode ? '#EBFFEF' : '#1B5E20', 
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
                      background: feedbackColors.warningBg,
                      borderRadius: 10,
                      border: `2px solid ${feedbackColors.warningBorder}`,
                      boxShadow: '0 6px 16px rgba(255,152,0,0.2)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: 12
                      }}>
                        <div style={{
                          fontSize: 13,
                          color: '#FFC78E',
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
                        color: darkMode ? '#FFE3C4' : '#E65100', 
                        lineHeight: 1.6,
                        fontWeight: 500
                      }}>
                        {answer.feedback_improve}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Sentiment & Emotion Analysis */}
              {(answer.sentiment_data || answer.emotion_data || answer.content_score !== undefined) && (
                <div style={{
                  marginTop: 20,
                  padding: 20,
                  background: darkMode ? theme.bgSecondary : '#F9F9F9',
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`
                }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: theme.text,
                    marginBottom: 15,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Detailed Analysis Breakdown
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: 12,
                    marginBottom: 15
                  }}>
                    {answer.content_score !== undefined && (
                      <div style={{
                        padding: 16,
                        background: feedbackColors.contentBg,
                        borderRadius: 12,
                        textAlign: 'center',
                        border: `2px solid ${feedbackColors.contentBorder}`,
                        color: '#FCE9C3',
                        boxShadow: '0 6px 16px rgba(228,196,114,0.25)'
                      }}>
                        <div style={{ fontSize: 14, color: '#FCE9C3', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>
                          Content
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#FFD271' }}>
                          {answer.content_score}/10
                        </div>
                      </div>
                    )}
                    {answer.sentiment_score !== undefined && (
                      <div style={{
                        padding: 16,
                        background: feedbackColors.toneBg,
                        borderRadius: 12,
                        textAlign: 'center',
                        border: `2px solid ${feedbackColors.toneBorder}`,
                        color: '#C2FFF9',
                        boxShadow: '0 6px 16px rgba(38,166,154,0.25)'
                      }}>
                        <div style={{ fontSize: 14, color: '#C2FFF9', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>
                          Tone
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#4DD0E1' }}>
                          {answer.sentiment_score}/10
                        </div>
                      </div>
                    )}
                    {answer.emotion_score !== undefined && (
                      <div style={{
                        padding: 16,
                        background: feedbackColors.expressionBg,
                        borderRadius: 12,
                        textAlign: 'center',
                        border: `2px solid ${feedbackColors.expressionBorder}`,
                        color: '#DDF7D5',
                        boxShadow: '0 6px 16px rgba(124,179,66,0.25)'
                      }}>
                        <div style={{ fontSize: 14, color: '#DDF7D5', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>
                          Expression
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#A5D56A' }}>
                          {answer.emotion_score}/10
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sentiment Details */}
                  {answer.sentiment_data && typeof answer.sentiment_data === 'object' && (
                    <div style={{
                      padding: 16,
                      background: darkMode ? theme.bgCard : '#FFFFFF',
                      borderRadius: 8,
                      marginBottom: 10,
                      borderLeft: `3px solid ${theme.purple}`
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 12 }}>
                        Sentiment & Tone Analysis
                      </div>
                      
                      {/* Main State */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color: theme.textTertiary, marginBottom: 4 }}>Emotional State</div>
                        <div style={{ 
                          fontSize: 14, 
                          fontWeight: 600, 
                          color: answer.sentiment_data.emotional_state === 'confident' ? theme.success : 
                                 answer.sentiment_data.emotional_state === 'nervous' ? theme.error :
                                 answer.sentiment_data.emotional_state === 'hesitant' ? theme.warning : theme.text
                        }}>
                          {answer.sentiment_data.emotional_state || 'neutral'}
                        </div>
                        {answer.sentiment_data.overall_sentiment && (
                          <div style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4 }}>
                            Overall: <strong>{answer.sentiment_data.overall_sentiment}</strong>
                          </div>
                        )}
                      </div>

                      {/* Metrics Grid */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', 
                        gap: 10,
                        marginBottom: 12
                      }}>
                        {answer.sentiment_data.confidence_score !== undefined && (
                          <div>
                            <div style={{ fontSize: 10, color: theme.textTertiary, marginBottom: 4 }}>Confidence</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>
                              {(answer.sentiment_data.confidence_score * 100).toFixed(0)}%
                            </div>
                          </div>
                        )}
                        {answer.sentiment_data.clarity_score !== undefined && (
                          <div>
                            <div style={{ fontSize: 10, color: theme.textTertiary, marginBottom: 4 }}>Clarity</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>
                              {(answer.sentiment_data.clarity_score * 100).toFixed(0)}%
                            </div>
                          </div>
                        )}
                        {answer.sentiment_data.nervousness_score !== undefined && (
                          <div>
                            <div style={{ fontSize: 10, color: theme.textTertiary, marginBottom: 4 }}>Nervousness</div>
                            <div style={{ 
                              fontSize: 13, 
                              fontWeight: 600, 
                              color: answer.sentiment_data.nervousness_score > 0.5 ? theme.error : theme.text
                            }}>
                              {(answer.sentiment_data.nervousness_score * 100).toFixed(0)}%
                            </div>
                          </div>
                        )}
                        {answer.sentiment_data.hesitation_score !== undefined && (
                          <div>
                            <div style={{ fontSize: 10, color: theme.textTertiary, marginBottom: 4 }}>Hesitation</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>
                              {(answer.sentiment_data.hesitation_score * 100).toFixed(0)}%
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tone Scores */}
                      {answer.sentiment_data.tone_scores && typeof answer.sentiment_data.tone_scores === 'object' && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.border}` }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 8 }}>
                            Tone Distribution:
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {Object.entries(answer.sentiment_data.tone_scores).map(([tone, value]) => {
                              const toneColors = {
                                positive: '#4CAF50',
                                neutral: '#9E9E9E',
                                negative: '#F44336'
                              }
                              return (
                                <div key={tone} style={{
                                  flex: 1,
                                  padding: 8,
                                  background: 'rgba(255,255,255,0.03)',
                                  borderRadius: 6,
                                  textAlign: 'center',
                                  border: `1px solid ${toneColors[tone] || '#555'}`
                                }}>
                                  <div style={{ fontSize: 10, color: toneColors[tone] || theme.textTertiary, marginBottom: 4, textTransform: 'capitalize' }}>
                                    {tone}
                                  </div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
                                    {(value * 100).toFixed(0)}%
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Emotion Details */}
                  {answer.emotion_data && typeof answer.emotion_data === 'object' && (
                    <div style={{
                      padding: 16,
                      background: darkMode ? theme.bgCard : '#FFFFFF',
                      borderRadius: 8,
                      borderLeft: `3px solid ${theme.success}`,
                      marginTop: 10
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 12 }}>
                        Facial Expression Analysis
                      </div>
                      
                      {/* Emotion State & Dominant */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: 10, 
                        marginBottom: 12 
                      }}>
                        <div>
                          <div style={{ fontSize: 10, color: theme.textTertiary, marginBottom: 4 }}>Interview State</div>
                          <div style={{ 
                            fontSize: 13, 
                            fontWeight: 600, 
                            color: answer.emotion_data.interview_state === 'confident' ? theme.success : 
                                   answer.emotion_data.interview_state === 'nervous' ? theme.error :
                                   answer.emotion_data.interview_state === 'hesitant' ? theme.warning : theme.text
                          }}>
                            {answer.emotion_data.interview_state || 'neutral'}
                          </div>
                        </div>
                        {answer.emotion_data.dominant_emotion && (
                          <div>
                            <div style={{ fontSize: 10, color: theme.textTertiary, marginBottom: 4 }}>Dominant Emotion</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>
                              {answer.emotion_data.dominant_emotion}
                              {answer.emotion_data.max_confidence && (
                                <span style={{ fontSize: 11, color: theme.textTertiary, marginLeft: 6 }}>
                                  ({(answer.emotion_data.max_confidence * 100).toFixed(0)}%)
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Detailed Emotion Breakdown */}
                      {answer.emotion_data.emotions && typeof answer.emotion_data.emotions === 'object' && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 8 }}>
                            Emotion Distribution:
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {Object.entries(answer.emotion_data.emotions)
                              .sort((a, b) => b[1] - a[1])
                              .map(([emotion, value]) => {
                                const percentage = typeof value === 'number' ? (value * 100).toFixed(1) : '0.0';
                                const emotionValue = typeof value === 'number' ? value : 0;
                                const emotionColors = {
                                  'happy': theme.success,
                                  'sad': theme.error,
                                  'angry': '#F44336',
                                  'fear': '#9C27B0',
                                  'surprise': theme.warning,
                                  'disgust': '#795548',
                                  'neutral': theme.textTertiary
                                };
                                return (
                                  <div key={emotion} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ 
                                      width: 60, 
                                      fontSize: 11, 
                                      color: theme.textSecondary,
                                      textTransform: 'capitalize',
                                      fontWeight: 500
                                    }}>
                                      {emotion}:
                                    </div>
                                    <div style={{ 
                                      flex: 1, 
                                      height: 8, 
                                      background: '#1b1b1b',
                                      borderRadius: 4,
                                      overflow: 'hidden'
                                    }}>
                                      <div style={{
                                        width: `${emotionValue * 100}%`,
                                        height: '100%',
                                        background: emotionColors[emotion] || theme.accent,
                                        transition: 'width 0.3s ease',
                                        boxShadow: `0 0 10px ${(emotionColors[emotion] || theme.accent)}55`
                                      }} />
                                    </div>
                                    <div style={{ 
                                      width: 40, 
                                      fontSize: 11, 
                                      color: theme.text,
                                      fontWeight: 600,
                                      textAlign: 'right'
                                    }}>
                                      {percentage}%
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Additional Info */}
                      <div style={{ 
                        display: 'flex', 
                        gap: 15, 
                        marginTop: 12, 
                        paddingTop: 12, 
                        borderTop: `1px solid ${theme.border}`,
                        fontSize: 10,
                        color: theme.textTertiary
                      }}>
                        {answer.emotion_data.confidence_level && (
                          <div><strong>Detection:</strong> {answer.emotion_data.confidence_level}</div>
                        )}
                        {answer.emotion_data.frames_analyzed && (
                          <div><strong>Frames:</strong> {answer.emotion_data.frames_analyzed}</div>
                        )}
                        {answer.emotion_data.detection_method && (
                          <div><strong>Method:</strong> {answer.emotion_data.detection_method}</div>
                        )}
                      </div>
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
              background: theme.primaryGradient,
              color: '#fff',
              fontSize: 18,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(32, 34, 33, 0.6)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 6px 20px rgba(32, 34, 33, 0.7)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 15px rgba(32, 34, 33, 0.6)'
            }}
          >
            Complete Session
          </button>
        </div>
      </div>
    </div>
  )
}