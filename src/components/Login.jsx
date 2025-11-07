import React, { useState, useEffect } from 'react'

export default function Login({ onLogin, darkMode = true, theme = {} }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [currentFeature, setCurrentFeature] = useState(0)
  const [particles, setParticles] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const features = [
    {
      icon: '🎤',
      title: 'AI-Powered Interviews',
      description: 'Practice with our intelligent AI interviewer that adapts to your responses',
      color: '#0A84FF'
    },
    {
      icon: '📊',
      title: 'Real-time Feedback',
      description: 'Get instant analysis and scoring on every answer you provide',
      color: '#30D158'
    },
    {
      icon: '📄',
      title: 'Smart Resume Analysis',
      description: 'Upload your resume and get personalized questions tailored to your skills',
      color: '#BF5AF2'
    },
    {
      icon: '📈',
      title: 'Performance Reports',
      description: 'Track your progress with detailed analytics and improvement suggestions',
      color: '#FF9F0A'
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

  return (
    <div style={{
      minHeight: '100vh',
      background: darkMode 
        ? 'linear-gradient(135deg, #0A0E27 0%, #1a1a2e 50%, #16213e 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
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
              background: darkMode 
                ? 'rgba(10, 132, 255, 0.6)'
                : 'rgba(255, 255, 255, 0.8)',
              animation: `float ${particle.duration}s infinite ease-in-out ${particle.delay}s`,
              boxShadow: darkMode
                ? '0 0 10px rgba(10, 132, 255, 0.5)'
                : '0 0 10px rgba(255, 255, 255, 0.5)'
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
        backgroundImage: darkMode
          ? 'linear-gradient(rgba(10, 132, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(10, 132, 255, 0.05) 1px, transparent 1px)'
          : 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
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
            box-shadow: 0 0 20px rgba(10, 132, 255, 0.5);
          }
          50% {
            box-shadow: 0 0 40px rgba(10, 132, 255, 0.8);
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
              fontSize: 56,
              fontWeight: 800,
              margin: 0,
              background: 'linear-gradient(135deg, #0A84FF 0%, #BF5AF2 50%, #FF9F0A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-2px',
              marginBottom: 15
            }}>
              INTERVUO
            </h1>
            <p style={{
              fontSize: 20,
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.9)',
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
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
                  borderRadius: 24,
                  padding: 40,
                  opacity: currentFeature === index ? 1 : 0,
                  transform: currentFeature === index ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  pointerEvents: currentFeature === index ? 'auto' : 'none',
                  boxShadow: currentFeature === index
                    ? `0 20px 60px ${feature.color}40`
                    : 'none'
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
                  color: darkMode ? '#FFFFFF' : '#FFFFFF',
                  marginBottom: 15,
                  letterSpacing: '-1px'
                }}>
                  {feature.title}
                </h2>
                <p style={{
                  fontSize: 18,
                  color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.9)',
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
                    ? 'linear-gradient(90deg, #0A84FF 0%, #BF5AF2 100%)'
                    : darkMode 
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(255, 255, 255, 0.4)',
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
              background: 'linear-gradient(90deg, transparent, #0A84FF, transparent)',
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
                      e.target.style.border = '2px solid #0A84FF'
                      e.target.style.boxShadow = '0 0 20px rgba(10, 132, 255, 0.3)'
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
                      e.target.style.border = '2px solid #0A84FF'
                      e.target.style.boxShadow = '0 0 20px rgba(10, 132, 255, 0.3)'
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
                  background: 'rgba(255, 69, 58, 0.15)',
                  border: '1px solid rgba(255, 69, 58, 0.3)',
                  color: '#FF453A',
                  fontSize: 14,
                  marginBottom: 24,
                  animation: 'fadeIn 0.3s ease-out'
                }}>
                  ⚠️ {error}
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
                    ? 'rgba(10, 132, 255, 0.5)'
                    : 'linear-gradient(135deg, #0A84FF 0%, #BF5AF2 100%)',
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: isLoading ? 'none' : '0 10px 30px rgba(10, 132, 255, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 15px 40px rgba(10, 132, 255, 0.5)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 10px 30px rgba(10, 132, 255, 0.4)'
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

            {/* Demo Credentials */}
            <div style={{
              marginTop: 30,
              padding: 16,
              borderRadius: 12,
              background: darkMode 
                ? 'rgba(191, 90, 242, 0.1)'
                : 'rgba(191, 90, 242, 0.2)',
              border: '1px solid rgba(191, 90, 242, 0.3)',
              textAlign: 'center'
            }}>
              <p style={{
                margin: 0,
                fontSize: 13,
                color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                marginBottom: 8
              }}>
                Demo Credentials
              </p>
              <p style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                color: '#BF5AF2',
                fontFamily: 'monospace'
              }}>
                Username: admin | Password: admin
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}