import React, { useState } from 'react'

export default function ResumeUpload({ onQuestionsGenerated, darkMode = true, theme = {} }) {
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [scanProgress, setScanProgress] = useState(0)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFile = (file) => {
    if (file && file.type === 'application/pdf') {
      setFile(file)
      setFileName(file.name)
      setResults(null)
      setError('')
    } else {
      alert('Please upload a PDF file')
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const analyzeResume = async () => {
    if (!file) {
      alert('Please upload a resume first')
      return
    }

    setAnalyzing(true)
    setError('')
    setScanProgress(0)

    // Simulate scanning progress
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return 95
        }
        return prev + 5
      })
    }, 100)

    try {
      const formData = new FormData()
      formData.append('resume', file)

      const response = await fetch('http://localhost:5000/api/analyze-resume', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze resume')
      }

     const data = await response.json()
      clearInterval(progressInterval)
      setScanProgress(100)
      
      setTimeout(() => {
        setResults(data)
        if (onQuestionsGenerated && data.interviewQuestions) {
          onQuestionsGenerated(data.interviewQuestions, {
            name: data.name,
            email: data.email,
            field: data.recommendedField,
            level: data.level
          })
        }
      }, 500)
    } catch (err) {
      clearInterval(progressInterval)
      console.error('Error analyzing resume:', err)
      setError(err.message || 'Failed to analyze resume. Make sure the Python server is running!')
      alert('Error: ' + (err.message || 'Failed to analyze resume'))
    } finally {
      setTimeout(() => {
        setAnalyzing(false)
        setScanProgress(0)
      }, 1000)
    }
  }

  const clearResults = () => {
    setFile(null)
    setFileName('')
    setResults(null)
    setError('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
      padding: '60px 20px',
      boxSizing: 'border-box',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Grid */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: darkMode
          ? 'linear-gradient(rgba(10, 132, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(10, 132, 255, 0.03) 1px, transparent 1px)'
          : 'linear-gradient(rgba(102, 126, 234, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(102, 126, 234, 0.05) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        animation: 'gridMove 20s linear infinite',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <style>{`
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        @keyframes glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes dataStream {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100px); opacity: 0; }
        }
      `}</style>

      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: 60,
          animation: 'slideUp 0.8s ease-out'
        }}>
          <h1 style={{
            fontSize: 48,
            fontWeight: 800,
            margin: 0,
            marginBottom: 15,
            background: 'linear-gradient(135deg, #0A84FF 0%, #BF5AF2 50%, #FF9F0A 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-2px'
          }}>
            Smart Resume Analyzer
          </h1>
          <p style={{
            fontSize: 18,
            color: theme.textSecondary,
            margin: 0,
            fontWeight: 500,
            letterSpacing: '0.5px'
          }}>
            Powered by Advanced AI Technology
          </p>
        </div>

        {error && (
          <div style={{
            background: darkMode ? theme.error + '20' : '#FFEBEE',
            color: theme.error,
            padding: 20,
            borderRadius: 16,
            marginBottom: 30,
            textAlign: 'center',
            border: `2px solid ${theme.error}`,
            fontWeight: 500,
            animation: 'slideUp 0.5s ease-out',
            boxShadow: `0 10px 30px ${theme.error}30`
          }}>
            ⚠️ {error}
          </div>
        )}

        {!results && (
          <div style={{
            animation: 'slideUp 1s ease-out 0.2s both'
          }}>
            {/* Upload Zone */}
            <div style={{
              background: theme.bgCard,
              borderRadius: 24,
              padding: 50,
              boxShadow: `0 20px 60px ${theme.shadow}`,
              marginBottom: 40,
              border: `1px solid ${theme.border}`,
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Scanning Line Effect */}
              {analyzing && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: 'linear-gradient(90deg, transparent, #0A84FF, transparent)',
                  animation: 'scan 2s ease-in-out infinite',
                  zIndex: 10
                }} />
              )}

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                  border: dragActive 
                    ? `3px dashed ${theme.accent}`
                    : `2px dashed ${theme.border}`,
                  borderRadius: 20,
                  padding: 70,
                  textAlign: 'center',
                  background: dragActive 
                    ? (darkMode ? theme.accent + '10' : '#E3F2FD')
                    : theme.bgSecondary,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Data Stream Animation */}
                {dragActive && (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} style={{
                        position: 'absolute',
                        left: `${20 + i * 20}%`,
                        top: -20,
                        width: 2,
                        height: 20,
                        background: theme.accent,
                        animation: `dataStream 1s ease-in-out infinite ${i * 0.2}s`,
                        opacity: 0
                      }} />
                    ))}
                  </>
                )}

                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                  id="file-upload"
                  disabled={analyzing}
                />
                
                <div style={{
                  fontSize: 80,
                  marginBottom: 25,
                  animation: fileName ? 'pulse 2s ease-in-out infinite' : 'none',
                  filter: dragActive ? 'hue-rotate(90deg)' : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  {dragActive ? '⚡' : fileName ? '✓' : '📄'}
                </div>
                
                {fileName ? (
                  <div>
                    <p style={{ 
                      fontSize: 20, 
                      fontWeight: 700, 
                      color: theme.success, 
                      marginBottom: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10
                    }}>
                      <span style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: theme.success,
                        animation: 'glow 2s ease-in-out infinite'
                      }} />
                      {fileName}
                    </p>
                    <button
                      onClick={() => document.getElementById('file-upload').click()}
                      disabled={analyzing}
                      style={{
                        padding: '14px 28px',
                        borderRadius: 12,
                        border: `2px solid ${theme.border}`,
                        background: theme.bgCard,
                        color: theme.textSecondary,
                        cursor: analyzing ? 'not-allowed' : 'pointer',
                        fontSize: 15,
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                        opacity: analyzing ? 0.5 : 1
                      }}
                    >
                      Choose Different File
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ 
                      fontSize: 20, 
                      marginBottom: 25, 
                      color: theme.textSecondary,
                      fontWeight: 500
                    }}>
                      {dragActive ? '⚡ Drop your resume here' : 'Drag and drop your resume here, or'}
                    </p>
                    <label htmlFor="file-upload">
                      <span style={{
                        display: 'inline-block',
                        padding: '16px 40px',
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #0A84FF 0%, #BF5AF2 100%)',
                        color: '#fff',
                        fontSize: 17,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 10px 30px rgba(10, 132, 255, 0.4)',
                        transition: 'all 0.3s ease',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-3px)'
                        e.target.style.boxShadow = '0 15px 40px rgba(10, 132, 255, 0.5)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = '0 10px 30px rgba(10, 132, 255, 0.4)'
                      }}>
                        Browse Files
                      </span>
                    </label>
                    <p style={{ 
                      fontSize: 14, 
                      marginTop: 25, 
                      color: theme.textTertiary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}>
                      <span style={{
                        display: 'inline-block',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: theme.accent
                      }} />
                      Only PDF files are supported
                    </p>
                  </div>
                )}
              </div>

              {/* Analyze Button */}
              {fileName && (
                <div style={{ textAlign: 'center', marginTop: 40 }}>
                  <button
                    onClick={analyzeResume}
                    disabled={analyzing}
                    style={{
                      padding: '20px 60px',
                      borderRadius: 16,
                      border: 'none',
                      background: analyzing
                        ? 'linear-gradient(135deg, rgba(10, 132, 255, 0.5) 0%, rgba(191, 90, 242, 0.5) 100%)'
                        : 'linear-gradient(135deg, #0A84FF 0%, #BF5AF2 100%)',
                      color: '#fff',
                      fontSize: 18,
                      fontWeight: 700,
                      cursor: analyzing ? 'not-allowed' : 'pointer',
                      boxShadow: analyzing ? 'none' : '0 15px 40px rgba(10, 132, 255, 0.4)',
                      transition: 'all 0.3s ease',
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (!analyzing) {
                        e.target.style.transform = 'translateY(-3px)'
                        e.target.style.boxShadow = '0 20px 50px rgba(10, 132, 255, 0.5)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!analyzing) {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = '0 15px 40px rgba(10, 132, 255, 0.4)'
                      }
                    }}
                  >
                    {analyzing ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                        <span style={{
                          width: 20,
                          height: 20,
                          border: '3px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite'
                        }} />
                        Analyzing...
                      </span>
                    ) : (
                      '🚀 Analyze Resume'
                    )}
                  </button>

                  <style>{`
                    @keyframes spin {
                      to { transform: rotate(360deg); }
                    }
                  `}</style>

                  {/* Progress Bar */}
                  {analyzing && (
                    <div style={{ marginTop: 30 }}>
                      <div style={{
                        width: '100%',
                        height: 6,
                        background: theme.bgSecondary,
                        borderRadius: 3,
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: `${scanProgress}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #0A84FF 0%, #BF5AF2 100%)',
                          transition: 'width 0.3s ease',
                          borderRadius: 3,
                          boxShadow: '0 0 20px rgba(10, 132, 255, 0.6)'
                        }} />
                      </div>
                      <p style={{
                        marginTop: 15,
                        fontSize: 14,
                        color: theme.textSecondary,
                        fontWeight: 600
                      }}>
                        Scanning Document... {scanProgress}%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Info Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 20,
              animation: 'slideUp 1s ease-out 0.4s both'
            }}>
              {[
                { icon: '🎯', title: 'Skill Detection', desc: 'AI identifies your key skills' },
                { icon: '📊', title: 'Smart Analysis', desc: 'Deep resume evaluation' },
                { icon: '💡', title: 'Recommendations', desc: 'Get improvement tips' },
                { icon: '🎤', title: 'Interview Prep', desc: 'Generate custom questions' }
              ].map((item, i) => (
                <div key={i} style={{
                  background: theme.bgCard,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 16,
                  padding: 25,
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)'
                  e.currentTarget.style.boxShadow = `0 15px 40px ${theme.shadow}`
                  e.currentTarget.style.borderColor = theme.accent
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = theme.border
                }}>
                  <div style={{
                    fontSize: 48,
                    marginBottom: 15,
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                  }}>
                    {item.icon}
                  </div>
                  <h3 style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: theme.text,
                    marginBottom: 8
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontSize: 14,
                    color: theme.textSecondary,
                    margin: 0,
                    lineHeight: 1.6
                  }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Section - Keep existing results display */}
        {results && (
          <div style={{ animation: 'slideUp 0.8s ease-out' }}>
            {/* Personal Info */}
            <div style={{
              background: 'linear-gradient(135deg, #0A84FF 0%, #BF5AF2 100%)',
              borderRadius: 24,
              padding: 40,
              marginBottom: 30,
              color: '#fff',
              border: `1px solid ${theme.accent}`,
              boxShadow: '0 20px 60px rgba(10, 132, 255, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Animated corner accents */}
              <div style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 100,
                height: 100,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
                animation: 'pulse 3s ease-in-out infinite'
              }} />
              
              <h2 style={{ 
                marginBottom: 20, 
                fontSize: 28, 
                fontWeight: 700,
                letterSpacing: '-1px'
              }}>
                📋 Resume Summary
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 20,
                marginTop: 25
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: 20,
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <p style={{ margin: 0, fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Name</p>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{results.name}</p>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: 20,
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <p style={{ margin: 0, fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Email</p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{results.email}</p>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: 20,
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <p style={{ margin: 0, fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Level</p>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{results.level}</p>
                </div>
              </div>
            </div>

            {/* Interview Questions */}
            {results.interviewQuestions && results.interviewQuestions.length > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 24,
                padding: 40,
                marginBottom: 30,
                color: '#fff',
                border: `1px solid ${theme.accent}`,
                boxShadow: '0 20px 60px rgba(102, 126, 234, 0.3)'
              }}>
                <h2 style={{ 
                  marginBottom: 20, 
                  fontSize: 28, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12,
                  fontWeight: 700,
                  letterSpacing: '-1px'
                }}>
                  🤖 AI-Generated Interview Questions
                </h2>
                <p style={{ marginBottom: 30, opacity: 0.95, fontSize: 17, fontWeight: 500 }}>
                  Based on your skills in <strong>{results.recommendedField}</strong> and <strong>{results.level}</strong> experience level
                </p>
                <div style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  borderRadius: 16, 
                  padding: 25,
                  backdropFilter: 'blur(10px)'
                }}>
                  {results.interviewQuestions.map((question, i) => (
                    <div key={i} style={{
                      marginBottom: 15,
                      padding: 20,
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: 12,
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                      e.currentTarget.style.transform = 'translateX(5px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}>
                      <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, fontWeight: 500 }}>
                        <strong style={{ 
                          color: '#FFD700',
                          fontSize: 18,
                          marginRight: 10
                        }}>Q{i + 1}:</strong> {question}
                      </p>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: 25, fontSize: 14, opacity: 0.9, textAlign: 'center', fontWeight: 500 }}>
                  💡 These questions are also available in the Virtual Interviewer section
                </p>
              </div>
            )}

            {/* Skills Analysis */}
            <div style={{
              background: theme.bgCard,
              borderRadius: 24,
              padding: 40,
              boxShadow: `0 20px 60px ${theme.shadow}`,
              marginBottom: 30,
              border: `1px solid ${theme.border}`,
              transition: 'all 0.3s ease'
            }}>
              <h2 style={{ 
                marginBottom: 30, 
                fontSize: 28, 
                color: theme.text,
                fontWeight: 700,
                letterSpacing: '-1px'
              }}>
                💡 Skills Analysis
              </h2>
              
              <div style={{ marginBottom: 35 }}>
                <h3 style={{ 
                  fontSize: 20, 
                  marginBottom: 20, 
                  color: theme.success,
                  fontWeight: 600
                }}>
                  Your Skills:
                </h3>
                {results.skills && results.skills.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {results.skills.map((skill, i) => (
                      <span key={i} style={{
                        padding: '12px 20px',
                        background: darkMode ? theme.success + '20' : '#E8F5E9',
                        color: theme.success,
                        borderRadius: 25,
                        fontSize: 15,
                        fontWeight: 600,
                        border: `2px solid ${theme.success}`,
                        boxShadow: `0 4px 12px ${theme.success}30`,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-3px)'
                        e.target.style.boxShadow = `0 6px 16px ${theme.success}40`
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = `0 4px 12px ${theme.success}30`
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: theme.textTertiary }}>No skills detected in resume</p>
                )}
              </div>

              <div>
                <h3 style={{ 
                  fontSize: 20, 
                  marginBottom: 20, 
                  color: theme.accent,
                  fontWeight: 600
                }}>
                  Recommended Skills:
                </h3>
                {results.recommendedSkills && results.recommendedSkills.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {results.recommendedSkills.map((skill, i) => (
                      <span key={i} style={{
                        padding: '12px 20px',
                        background: darkMode ? theme.accent + '20' : '#E3F2FD',
                        color: theme.accent,
                        borderRadius: 25,
                        fontSize: 15,
                        fontWeight: 600,
                        border: `2px solid ${theme.accent}`,
                        boxShadow: `0 4px 12px ${theme.accent}30`,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-3px)'
                        e.target.style.boxShadow = `0 6px 16px ${theme.accent}40`
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = `0 4px 12px ${theme.accent}30`
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div style={{
                marginTop: 30,
                padding: 20,
                background: darkMode ? theme.warning + '20' : '#FFF3E0',
                borderRadius: 16,
                color: theme.warning,
                fontSize: 16,
                fontWeight: 600,
                border: `2px solid ${theme.warning}`,
                boxShadow: `0 4px 12px ${theme.warning}30`
              }}>
                🎯 Recommended Field: <strong style={{ fontSize: 18 }}>{results.recommendedField}</strong>
              </div>
            </div>

            {/* Tips */}
            <div style={{
              background: theme.bgCard,
              borderRadius: 24,
              padding: 40,
              boxShadow: `0 20px 60px ${theme.shadow}`,
              marginBottom: 30,
              border: `1px solid ${theme.border}`,
              transition: 'all 0.3s ease'
            }}>
              <h2 style={{ 
                marginBottom: 30, 
                fontSize: 28, 
                color: theme.text,
                fontWeight: 700,
                letterSpacing: '-1px'
              }}>
                💡 Resume Tips
              </h2>
              {results.tips && results.tips.map((tip, i) => (
                <div key={i} style={{
                  marginBottom: 15,
                  padding: 20,
                  borderRadius: 16,
                  background: tip.present ? 
                    (darkMode ? theme.success + '15' : '#E8F5E9') : 
                    (darkMode ? theme.warning + '15' : '#FFF3E0'),
                  color: tip.present ? theme.success : theme.warning,
                  fontSize: 15,
                  fontWeight: 500,
                  border: `2px solid ${tip.present ? theme.success : theme.warning}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(5px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)'
                }}>
                  <span style={{ fontSize: 18, marginRight: 12 }}>
                    {tip.present ? '✓' : '⚠'}
                  </span>
                  {tip.text}
                </div>
              ))}
            </div>

            {/* Courses */}
            <div style={{
              background: theme.bgCard,
              borderRadius: 24,
              padding: 40,
              boxShadow: `0 20px 60px ${theme.shadow}`,
              marginBottom: 30,
              border: `1px solid ${theme.border}`,
              transition: 'all 0.3s ease'
            }}>
              <h2 style={{ 
                marginBottom: 30, 
                fontSize: 28, 
                color: theme.text,
                fontWeight: 700,
                letterSpacing: '-1px'
              }}>
                🎓 Recommended Courses
              </h2>
              {results.courses && results.courses.map((course, i) => (
                <div key={i} style={{
                  padding: 20,
                  borderRadius: 16,
                  background: theme.bgSecondary,
                  marginBottom: 15,
                  border: `1px solid ${theme.border}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = darkMode ? 'rgba(10, 132, 255, 0.1)' : '#E3F2FD'
                  e.currentTarget.style.borderColor = theme.accent
                  e.currentTarget.style.transform = 'translateX(5px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme.bgSecondary
                  e.currentTarget.style.borderColor = theme.border
                  e.currentTarget.style.transform = 'translateX(0)'
                }}>
                  <a
                    href={course.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: theme.accent,
                      textDecoration: 'none',
                      fontSize: 16,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}
                  >
                    <span style={{ 
                      fontSize: 18,
                      background: darkMode ? theme.accent + '20' : '#E3F2FD',
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      fontWeight: 700
                    }}>
                      {i + 1}
                    </span>
                    {course.name}
                    <span style={{ marginLeft: 'auto' }}>→</span>
                  </a>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={clearResults}
                style={{
                  padding: '18px 50px',
                  borderRadius: 16,
                  border: 'none',
                  background: 'linear-gradient(135deg, #FF453A 0%, #FF9F0A 100%)',
                  color: '#fff',
                  fontSize: 17,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(255, 69, 58, 0.4)',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-3px)'
                  e.target.style.boxShadow = '0 15px 40px rgba(255, 69, 58, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 10px 30px rgba(255, 69, 58, 0.4)'
                }}
              >
                Analyze Another Resume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}