import React, { useState } from 'react'

export default function ResumeUpload({ onQuestionsGenerated }) {
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
      background: '#f0f2f5',
      padding: '40px 20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: 40,
          fontSize: 36,
          fontWeight: 600,
          color: '#333'
        }}>
          Smart Resume Analyzer
        </h1>

        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: 15,
            borderRadius: 8,
            marginBottom: 20,
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}

        {!results && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 40,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            marginBottom: 30
          }}>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? '#4CAF50' : '#ccc'}`,
                borderRadius: 12,
                padding: 60,
                textAlign: 'center',
                background: dragActive ? '#f0f9ff' : '#fafafa',
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
                  <p style={{ fontSize: 18, fontWeight: 600, color: '#4CAF50', marginBottom: 10 }}>
                    ✓ {fileName}
                  </p>
                  <button
                    onClick={() => document.getElementById('file-upload').click()}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 8,
                      border: '1px solid #ccc',
                      background: '#fff',
                      color: '#333',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500
                    }}
                  >
                    Choose Different File
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 18, marginBottom: 15, color: '#666' }}>
                    Drag and drop your resume here, or
                  </p>
                  <label htmlFor="file-upload">
                    <span style={{
                      display: 'inline-block',
                      padding: '12px 30px',
                      borderRadius: 8,
                      background: '#4CAF50',
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}>
                      Browse Files
                    </span>
                  </label>
                  <p style={{ fontSize: 14, marginTop: 15, color: '#999' }}>
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
                    padding: '14px 40px',
                    borderRadius: 8,
                    border: 'none',
                    background: analyzing ? '#ccc' : '#2196F3',
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: analyzing ? 'not-allowed' : 'pointer',
                    opacity: analyzing ? 0.6 : 1
                  }}
                >
                  {analyzing ? '🔄 Analyzing & Generating Questions...' : 'Analyze Resume'}
                </button>
              </div>
            )}
          </div>
        )}

        {results && (
          <div>
            {/* Basic Info */}
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 30,
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              marginBottom: 20
            }}>
              <h2 style={{ marginBottom: 20, fontSize: 24, color: '#333' }}>📋 Resume Analysis</h2>
              <div style={{ fontSize: 18, marginBottom: 30 }}>
                <p style={{ marginBottom: 8 }}>👤 <strong>Name:</strong> {results.name}</p>
                <p style={{ marginBottom: 8 }}>📧 <strong>Email:</strong> {results.email}</p>
                <p style={{ marginBottom: 8 }}>📱 <strong>Contact:</strong> {results.phone}</p>
                <p style={{ marginBottom: 8 }}>📄 <strong>Pages:</strong> {results.pages}</p>
                <p style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  borderRadius: 20,
                  background: results.level === 'Fresher' ? '#ffebee' : results.level === 'Intermediate' ? '#e8f5e9' : '#fff3e0',
                  color: results.level === 'Fresher' ? '#c62828' : results.level === 'Intermediate' ? '#2e7d32' : '#ef6c00',
                  fontWeight: 600,
                  fontSize: 16
                }}>
                  {results.level} Level
                </p>
              </div>

              {/* Resume Score */}
              <div style={{ marginTop: 30 }}>
                <h3 style={{ marginBottom: 15, fontSize: 20 }}>📊 Resume Score</h3>
                <div style={{
                  width: '100%',
                  height: 30,
                  background: '#e0e0e0',
                  borderRadius: 15,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${results.resumeScore}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 600,
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 16,
                padding: 30,
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                marginBottom: 20,
                color: '#fff'
              }}>
                <h2 style={{ marginBottom: 20, fontSize: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  🤖 AI-Generated Interview Questions
                </h2>
                <p style={{ marginBottom: 25, opacity: 0.9, fontSize: 16 }}>
                  Based on your skills in <strong>{results.recommendedField}</strong> and <strong>{results.level}</strong> experience level
                </p>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 20 }}>
                  {results.interviewQuestions.map((question, i) => (
                    <div key={i} style={{
                      marginBottom: 15,
                      padding: 15,
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: 8,
                      backdropFilter: 'blur(10px)'
                    }}>
                      <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
                        <strong style={{ color: '#ffd700' }}>Q{i + 1}:</strong> {question}
                      </p>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: 20, fontSize: 14, opacity: 0.8, textAlign: 'center' }}>
                  💡 These questions are also available in the Virtual Interviewer section
                </p>
              </div>
            )}

            {/* Skills */}
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 30,
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              marginBottom: 20
            }}>
              <h2 style={{ marginBottom: 15, fontSize: 24, color: '#333' }}>💡 Skills Analysis</h2>
              <div style={{ marginBottom: 25 }}>
                <h3 style={{ fontSize: 18, marginBottom: 10, color: '#4CAF50' }}>Your Skills:</h3>
                {results.skills && results.skills.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {results.skills.map((skill, i) => (
                      <span key={i} style={{
                        padding: '8px 16px',
                        background: '#e8f5e9',
                        color: '#2e7d32',
                        borderRadius: 20,
                        fontSize: 14,
                        fontWeight: 500
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#999' }}>No skills detected in resume</p>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: 18, marginBottom: 10, color: '#2196F3' }}>Recommended Skills:</h3>
                {results.recommendedSkills && results.recommendedSkills.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {results.recommendedSkills.map((skill, i) => (
                      <span key={i} style={{
                        padding: '8px 16px',
                        background: '#e3f2fd',
                        color: '#1565c0',
                        borderRadius: 20,
                        fontSize: 14,
                        fontWeight: 500
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <p style={{
                marginTop: 20,
                padding: 15,
                background: '#fff3e0',
                borderRadius: 8,
                color: '#e65100',
                fontSize: 14,
                fontWeight: 500
              }}>
                🎯 Recommended Field: <strong>{results.recommendedField}</strong>
              </p>
            </div>

            {/* Tips */}
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 30,
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              marginBottom: 20
            }}>
              <h2 style={{ marginBottom: 15, fontSize: 24, color: '#333' }}>💡 Resume Tips</h2>
              {results.tips && results.tips.map((tip, i) => (
                <p key={i} style={{
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 8,
                  background: tip.present ? '#e8f5e9' : '#fff3e0',
                  color: tip.present ? '#2e7d32' : '#e65100',
                  fontSize: 14
                }}>
                  {tip.present ? '✓' : '⚠'} {tip.text}
                </p>
              ))}
            </div>

            {/* Courses */}
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 30,
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              marginBottom: 20
            }}>
              <h2 style={{ marginBottom: 15, fontSize: 24, color: '#333' }}>🎓 Recommended Courses</h2>
              {results.courses && results.courses.map((course, i) => (
                <div key={i} style={{
                  padding: 15,
                  borderRadius: 8,
                  background: '#f5f5f5',
                  marginBottom: 12
                }}>
                  <a
                    href={course.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#2196F3',
                      textDecoration: 'none',
                      fontSize: 16,
                      fontWeight: 500
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
                  padding: '14px 40px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#f44336',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer'
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