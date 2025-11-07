import React, { useState } from 'react'

export default function ResumeUpload({ onQuestionsGenerated, darkMode = true, theme = {} }) {
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')

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
      setResults(data)

      // Pass questions AND resume info to parent component
      if (onQuestionsGenerated && data.interviewQuestions) {
        onQuestionsGenerated(data.interviewQuestions, {
        name: data.name,
        email: data.email,
        field: data.recommendedField,
        level: data.level
        })
      }
    } catch (err) {
      console.error('Error analyzing resume:', err)
      setError(err.message || 'Failed to analyze resume. Make sure the Python server is running!')
      alert('Error: ' + (err.message || 'Failed to analyze resume'))
    } finally {
      setAnalyzing(false)
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
      padding: '40px 20px',
      boxSizing: 'border-box',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: 40,
          fontSize: 36,
          fontWeight: 700,
          color: theme.text,
          letterSpacing: '-1px'
        }}>
          Smart Resume Analyzer
        </h1>

        {error && (
          <div style={{
            background: darkMode ? theme.error + '20' : '#FFEBEE',
            color: theme.error,
            padding: 16,
            borderRadius: 12,
            marginBottom: 20,
            textAlign: 'center',
            border: `1px solid ${theme.error}`,
            fontWeight: 500
          }}>
            ⚠️ {error}
          </div>
        )}

        {!results && (
          <div style={{
            background: theme.bgCard,
            borderRadius: 16,
            padding: 40,
            boxShadow: `0 4px 20px ${theme.shadow}`,
            marginBottom: 30,
            border: `1px solid ${theme.border}`,
            transition: 'all 0.3s ease'
          }}>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? theme.accent : theme.border}`,
                borderRadius: 16,
                padding: 60,
                textAlign: 'center',
                background: dragActive ? (darkMode ? theme.accent + '10' : '#E3F2FD') : theme.bgSecondary,
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileInput}
                style={{ display: 'none' }}
                id="file-upload"
              />
              
              <div style={{ fontSize: 60, marginBottom: 20 }}>📄</div>
              
              {fileName ? (
                <div>
                  <p style={{ 
                    fontSize: 18, 
                    fontWeight: 600, 
                    color: theme.success, 
                    marginBottom: 15 
                  }}>
                    ✓ {fileName}
                  </p>
                  <button
                    onClick={() => document.getElementById('file-upload').click()}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 12,
                      border: `1px solid ${theme.border}`,
                      background: theme.bgCard,
                      color: theme.textSecondary,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Choose Different File
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ 
                    fontSize: 18, 
                    marginBottom: 20, 
                    color: theme.textSecondary,
                    fontWeight: 500
                  }}>
                    Drag and drop your resume here, or
                  </p>
                  <label htmlFor="file-upload">
                    <span style={{
                      display: 'inline-block',
                      padding: '14px 32px',
                      borderRadius: 12,
                      background: theme.accent,
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: `0 4px 16px ${theme.shadow}`,
                      transition: 'all 0.2s ease'
                    }}>
                      Browse Files
                    </span>
                  </label>
                  <p style={{ 
                    fontSize: 14, 
                    marginTop: 20, 
                    color: theme.textTertiary 
                  }}>
                    Only PDF files are supported
                  </p>
                </div>
              )}
            </div>

            {fileName && (
              <div style={{ textAlign: 'center', marginTop: 30 }}>
                <button
                  onClick={analyzeResume}
                  disabled={analyzing}
                  style={{
                    padding: '16px 48px',
                    borderRadius: 12,
                    border: 'none',
                    background: analyzing ? theme.border : theme.accent,
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: analyzing ? 'not-allowed' : 'pointer',
                    opacity: analyzing ? 0.6 : 1,
                    boxShadow: analyzing ? 'none' : `0 4px 16px ${theme.shadow}`,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {analyzing ? '⏳ Analyzing Resume...' : '🚀 Analyze Resume'}
                </button>
              </div>
            )}
          </div>
        )}

        {results && (
          <div>
            {/* Basic Info */}
            <div style={{
              background: theme.bgCard,
              borderRadius: 16,
              padding: 30,
              boxShadow: `0 4px 20px ${theme.shadow}`,
              marginBottom: 20,
              border: `1px solid ${theme.border}`,
              transition: 'all 0.3s ease'
            }}>
              <h2 style={{ 
                marginBottom: 20, 
                fontSize: 24, 
                color: theme.text,
                fontWeight: 700
              }}>
                📋 Resume Information
              </h2>
              <div style={{ color: theme.textSecondary, lineHeight: 2 }}>
                <p style={{ marginBottom: 8 }}>
                  <span style={{ color: theme.textTertiary }}>👤 Name:</span> 
                  <strong style={{ color: theme.text, marginLeft: 8 }}>{results.name}</strong>
                </p>
                <p style={{ marginBottom: 8 }}>
                  <span style={{ color: theme.textTertiary }}>📧 Email:</span> 
                  <strong style={{ color: theme.text, marginLeft: 8 }}>{results.email}</strong>
                </p>
                <p style={{ marginBottom: 8 }}>
                  <span style={{ color: theme.textTertiary }}>📱 Contact:</span> 
                  <strong style={{ color: theme.text, marginLeft: 8 }}>{results.phone}</strong>
                </p>
                <p style={{ marginBottom: 16 }}>
                  <span style={{ color: theme.textTertiary }}>📄 Pages:</span> 
                  <strong style={{ color: theme.text, marginLeft: 8 }}>{results.pages}</strong>
                </p>
                <span style={{
                  display: 'inline-block',
                  padding: '8px 20px',
                  borderRadius: 20,
                  background: results.level === 'Fresher' ? (darkMode ? theme.error + '20' : '#FFEBEE') : 
                             results.level === 'Intermediate' ? (darkMode ? theme.success + '20' : '#E8F5E9') : 
                             (darkMode ? theme.warning + '20' : '#FFF3E0'),
                  color: results.level === 'Fresher' ? theme.error : 
                         results.level === 'Intermediate' ? theme.success : theme.warning,
                  fontWeight: 700,
                  fontSize: 15,
                  border: `2px solid ${results.level === 'Fresher' ? theme.error : 
                         results.level === 'Intermediate' ? theme.success : theme.warning}`
                }}>
                  {results.level} Level
                </span>
              </div>

              {/* Resume Score */}
              <div style={{ marginTop: 30 }}>
                <h3 style={{ 
                  marginBottom: 15, 
                  fontSize: 18, 
                  color: theme.text,
                  fontWeight: 600
                }}>
                  📊 Resume Score
                </h3>
                <div style={{
                  width: '100%',
                  height: 40,
                  background: theme.bgSecondary,
                  borderRadius: 20,
                  overflow: 'hidden',
                  border: `1px solid ${theme.border}`
                }}>
                  <div style={{
                    width: `${results.resumeScore}%`,
                    height: '100%',
                    background: theme.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 16,
                    transition: 'width 1s ease'
                  }}>
                    {results.resumeScore}%
                  </div>
                </div>
              </div>
            </div>

            {/* AI Generated Interview Questions */}
            {results.interviewQuestions && results.interviewQuestions.length > 0 && (
              <div style={{
                background: theme.accent,
                borderRadius: 16,
                padding: 32,
                boxShadow: `0 8px 32px ${theme.accent}40`,
                marginBottom: 20,
                color: '#fff',
                border: `1px solid ${theme.accent}`
              }}>
                <h2 style={{ 
                  marginBottom: 16, 
                  fontSize: 24, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 10,
                  fontWeight: 700
                }}>
                  🤖 AI-Generated Interview Questions
                </h2>
                <p style={{ marginBottom: 24, opacity: 0.95, fontSize: 16, fontWeight: 500 }}>
                  Based on your skills in <strong>{results.recommendedField}</strong> and <strong>{results.level}</strong> experience level
                </p>
                <div style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  borderRadius: 12, 
                  padding: 20,
                  backdropFilter: 'blur(10px)'
                }}>
                  {results.interviewQuestions.map((question, i) => (
                    <div key={i} style={{
                      marginBottom: 12,
                      padding: 16,
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: 12,
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, fontWeight: 500 }}>
                        <strong style={{ color: '#FFD700' }}>Q{i + 1}:</strong> {question}
                      </p>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: 20, fontSize: 14, opacity: 0.9, textAlign: 'center', fontWeight: 500 }}>
                  💡 These questions are also available in the Virtual Interviewer section
                </p>
              </div>
            )}

            {/* Skills */}
            <div style={{
              background: theme.bgCard,
              borderRadius: 16,
              padding: 30,
              boxShadow: `0 4px 20px ${theme.shadow}`,
              marginBottom: 20,
              border: `1px solid ${theme.border}`,
              transition: 'all 0.3s ease'
            }}>
              <h2 style={{ 
                marginBottom: 20, 
                fontSize: 24, 
                color: theme.text,
                fontWeight: 700
              }}>
                💡 Skills Analysis
              </h2>
              <div style={{ marginBottom: 25 }}>
                <h3 style={{ 
                  fontSize: 18, 
                  marginBottom: 12, 
                  color: theme.success,
                  fontWeight: 600
                }}>
                  Your Skills:
                </h3>
                {results.skills && results.skills.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {results.skills.map((skill, i) => (
                      <span key={i} style={{
                        padding: '10px 18px',
                        background: darkMode ? theme.success + '20' : '#E8F5E9',
                        color: theme.success,
                        borderRadius: 20,
                        fontSize: 14,
                        fontWeight: 600,
                        border: `1px solid ${theme.success}`
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
                  fontSize: 18, 
                  marginBottom: 12, 
                  color: theme.accent,
                  fontWeight: 600
                }}>
                  Recommended Skills:
                </h3>
                {results.recommendedSkills && results.recommendedSkills.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {results.recommendedSkills.map((skill, i) => (
                      <span key={i} style={{
                        padding: '10px 18px',
                        background: darkMode ? theme.accent + '20' : '#E3F2FD',
                        color: theme.accent,
                        borderRadius: 20,
                        fontSize: 14,
                        fontWeight: 600,
                        border: `1px solid ${theme.accent}`
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <p style={{
                marginTop: 20,
                padding: 16,
                background: darkMode ? theme.warning + '20' : '#FFF3E0',
                borderRadius: 12,
                color: theme.warning,
                fontSize: 15,
                fontWeight: 600,
                border: `1px solid ${theme.warning}`
              }}>
                🎯 Recommended Field: <strong>{results.recommendedField}</strong>
              </p>
            </div>

            {/* Tips */}
            <div style={{
              background: theme.bgCard,
              borderRadius: 16,
              padding: 30,
              boxShadow: `0 4px 20px ${theme.shadow}`,
              marginBottom: 20,
              border: `1px solid ${theme.border}`,
              transition: 'all 0.3s ease'
            }}>
              <h2 style={{ 
                marginBottom: 20, 
                fontSize: 24, 
                color: theme.text,
                fontWeight: 700
              }}>
                💡 Resume Tips
              </h2>
              {results.tips && results.tips.map((tip, i) => (
                <p key={i} style={{
                  marginBottom: 12,
                  padding: 16,
                  borderRadius: 12,
                  background: tip.present ? 
                    (darkMode ? theme.success + '15' : '#E8F5E9') : 
                    (darkMode ? theme.warning + '15' : '#FFF3E0'),
                  color: tip.present ? theme.success : theme.warning,
                  fontSize: 14,
                  fontWeight: 500,
                  border: `1px solid ${tip.present ? theme.success : theme.warning}`
                }}>
                  {tip.present ? '✓' : '⚠'} {tip.text}
                </p>
              ))}
            </div>

            {/* Courses */}
            <div style={{
              background: theme.bgCard,
              borderRadius: 16,
              padding: 30,
              boxShadow: `0 4px 20px ${theme.shadow}`,
              marginBottom: 20,
              border: `1px solid ${theme.border}`,
              transition: 'all 0.3s ease'
            }}>
              <h2 style={{ 
                marginBottom: 20, 
                fontSize: 24, 
                color: theme.text,
                fontWeight: 700
              }}>
                🎓 Recommended Courses
              </h2>
              {results.courses && results.courses.map((course, i) => (
                <div key={i} style={{
                  padding: 16,
                  borderRadius: 12,
                  background: theme.bgSecondary,
                  marginBottom: 12,
                  border: `1px solid ${theme.border}`,
                  transition: 'all 0.2s ease'
                }}>
                  <a
                    href={course.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: theme.accent,
                      textDecoration: 'none',
                      fontSize: 15,
                      fontWeight: 600
                    }}
                  >
                    ({i + 1}) {course.name} →
                  </a>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={clearResults}
                style={{
                  padding: '16px 48px',
                  borderRadius: 12,
                  border: 'none',
                  background: theme.error,
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: `0 4px 16px ${theme.shadow}`,
                  transition: 'all 0.2s ease'
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