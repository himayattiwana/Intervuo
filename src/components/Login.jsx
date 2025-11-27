import React, { useState, useEffect } from 'react'

export default function Login({ onLogin, darkMode = true, theme = {} }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [currentFeature, setCurrentFeature] = useState(0)
  const [particles, setParticles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)

  const features = [
    {
      icon: '🎤',
      title: 'AI-Powered Interviews',
      description: 'Practice with our intelligent AI interviewer that adapts to your responses',
      color: '#B68B49'
    },
    {
      icon: '📊',
      title: 'Real-time Feedback',
      description: 'Get instant analysis and scoring on every answer you provide',
      color: '#906E2F'
    },
    {
      icon: '📄',
      title: 'Smart Resume Analysis',
      description: 'Upload your resume and get personalized questions tailored to your skills',
      color: '#654622'
    },
    {
      icon: '📈',
      title: 'Performance Reports',
      description: 'Track your progress with detailed analytics and improvement suggestions',
      color: '#4D574E'
    }
  ]

  // Generate particles on mount
  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5
    }))
    setParticles(newParticles)
  }, [])

  // Rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simulate loading
    setTimeout(() => {
      if (username === 'admin' && password === 'admin') {
        onLogin()
      } else {
        setError('Invalid credentials. Use admin/admin')
        setIsLoading(false)
      }
    }, 1500)
  }

  const heroGradient = theme.primaryGradient || 'linear-gradient(135deg, #3A2F23 0%, #5A452E 45%, #B68B49 100%)'
  const loginBackground = 'linear-gradient(135deg, #0F0D0A 0%, #1C1915 45%, #2B231B 100%)'
  const accentColor = theme.accent || '#B68B49'
  const accentGradient = heroGradient
  const errorColor = theme.error || '#654622'

  return (
    <div style={{
      minHeight: '100vh',
      background: loginBackground,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 30% 20%, rgba(182, 139, 73, 0.25), transparent 55%)',
        pointerEvents: 'none'
      }} />
      {/* Animated Background Particles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        {particles.map((particle) => (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              borderRadius: '50%',
              background: 'rgba(182, 139, 73, 0.4)',
              animation: `float ${particle.duration}s infinite ease-in-out ${particle.delay}s`,
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)'
            }}
          />
        ))}
      </div>

      {/* Animated Grid Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'linear-gradient(rgba(182, 139, 73, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(182, 139, 73, 0.07) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        animation: 'gridMove 20s linear infinite',
        pointerEvents: 'none'
      }} />

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.8;
          }
        }

        @keyframes gridMove {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(50px);
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(182, 139, 73, 0.45);
          }
          50% {
            box-shadow: 0 0 40px rgba(182, 139, 73, 0.7);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
      `}</style>

      {/* Main Content Container */}
      <div style={{
        display: 'flex',
        maxWidth: 1400,
        width: '100%',
        gap: 60,
        alignItems: 'center',
        zIndex: 1,
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {/* Left Side - Feature Showcase */}
        <div style={{
          flex: 1,
          minWidth: 400,
          animation: 'slideIn 1s ease-out'
        }}>
          {/* Logo & Title */}
          <div style={{
            marginBottom: 40,
            animation: 'fadeIn 1s ease-out'
          }}>
            <h1 style={{
              fontSize: 58,
              fontWeight: 900,
              margin: 0,
              background: 'linear-gradient(120deg, #F8E4C1 0%, #D8B679 30%, #B68B49 60%, #F5C87A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-2px',
              marginBottom: 15,
              textShadow: '0 0 40px rgba(246, 220, 176, 0.45)'
            }}>
              INTERVUO
            </h1>
            <p style={{
              fontSize: 20,
              color: 'rgba(245, 237, 224, 0.85)',
              margin: 0,
              fontWeight: 500,
              letterSpacing: '2px'
            }}>
              AI-POWERED INTERVIEW PRACTICE
            </p>
          </div>

          {/* Animated Feature Cards */}
          <div style={{
            position: 'relative',
            height: 320,
            marginBottom: 30
          }}>
            {features.map((feature, index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  background: darkMode
                    ? 'rgba(10, 9, 7, 0.75)'
                    : 'rgba(10, 9, 7, 0.75)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 24,
                  padding: 40,
                  opacity: currentFeature === index ? 1 : 0,
                  transform: currentFeature === index ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  pointerEvents: currentFeature === index ? 'auto' : 'none',
                  boxShadow: currentFeature === index
                    ? `0 20px 60px rgba(0, 0, 0, 0.6)`
                    : 'none',
                  color: '#F5EDE0'
                }}>
                <div style={{
                  fontSize: 72,
                  marginBottom: 20,
                  animation: currentFeature === index ? 'pulse 2s ease-in-out infinite' : 'none'
                }}>
                  {feature.icon}
                </div>
                <h2 style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: '#F5EDE0',
                  marginBottom: 15,
                  letterSpacing: '-1px'
                }}>
                  {feature.title}
                </h2>
                <p style={{
                  fontSize: 18,
                  color: 'rgba(245, 237, 224, 0.8)',
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Feature Indicators */}
          <div style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center'
          }}>
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentFeature(index)}
                style={{
                  width: currentFeature === index ? 40 : 12,
                  height: 12,
                  borderRadius: 6,
                  border: 'none',
                  background: currentFeature === index
                    ? accentGradient
                    : 'rgba(255, 255, 255, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: 0
                }}
              />
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div style={{
          flex: '0 0 450px',
          animation: 'fadeIn 1s ease-out 0.3s both'
        }}>
          <div style={{
            background: darkMode
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(30px)',
            border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
            borderRadius: 24,
            padding: 50,
            boxShadow: darkMode
              ? '0 30px 80px rgba(0, 0, 0, 0.5)'
              : '0 30px 80px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Scanning Line Effect */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
              animation: 'scan 3s ease-in-out infinite'
            }} />

            <h2 style={{
              fontSize: 32,
              fontWeight: 700,
              color: darkMode ? '#FFFFFF' : '#FFFFFF',
              marginBottom: 10,
              letterSpacing: '-1px'
            }}>
              Welcome Back
            </h2>
            <p style={{
              fontSize: 16,
              color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.8)',
              marginBottom: 40
            }}>
              Login to continue your interview practice
            </p>

            <form onSubmit={handleSubmit}>
              {/* Username Field */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  marginBottom: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Username
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      borderRadius: 12,
                      border: `2px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
                      background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.2)',
                      color: darkMode ? '#FFFFFF' : '#FFFFFF',
                      fontSize: 16,
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.border = `2px solid ${accentColor}`
                      e.target.style.boxShadow = '0 0 20px rgba(182, 139, 73, 0.35)'
                    }}
                    onBlur={(e) => {
                      e.target.style.border = `2px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    right: 20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 20
                  }}>
                    👤
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: 32 }}>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  marginBottom: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      borderRadius: 12,
                      border: `2px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
                      background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.2)',
                      color: darkMode ? '#FFFFFF' : '#FFFFFF',
                      fontSize: 16,
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.border = `2px solid ${accentColor}`
                      e.target.style.boxShadow = '0 0 20px rgba(182, 139, 73, 0.35)'
                    }}
                    onBlur={(e) => {
                      e.target.style.border = `2px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    right: 20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 20
                  }}>
                    🔒
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  padding: 12,
                  borderRadius: 12,
                  background: 'rgba(101, 70, 34, 0.2)',
                  border: '1px solid rgba(101, 70, 34, 0.4)',
                  color: errorColor,
                  fontSize: 14,
                  marginBottom: 24,
                  animation: 'fadeIn 0.3s ease-out'
                }}>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '18px',
                  borderRadius: 12,
                  border: 'none',
                  background: isLoading
                    ? 'rgba(101, 70, 34, 0.6)'
                    : heroGradient,
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: isLoading ? 'none' : '0 10px 30px rgba(0, 0, 0, 0.35)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.45)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.35)'
                  }
                }}
              >
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{ 
                      width: 16, 
                      height: 16, 
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    Authenticating...
                  </span>
                ) : (
                  'Login'
                )}
              </button>

              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </form>

            <div style={{ marginTop: 18, textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setShowCredentials(prev => !prev)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(245, 237, 224, 0.7)',
                  fontSize: 12,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                  opacity: 0.8
                }}
              >
                Forgot password?
              </button>
            </div>

            {showCredentials && (
              <div style={{
                marginTop: 12,
                padding: 14,
                borderRadius: 12,
                background: 'rgba(182, 139, 73, 0.12)',
                border: '1px solid rgba(182, 139, 73, 0.3)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: 13,
                textAlign: 'center'
              }}>
                Username: admin · Password: admin
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}