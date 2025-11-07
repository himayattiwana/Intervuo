import React, { useEffect, useRef, useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

export default function Interviewer({ 
  question="",
  onSubmit = (data) => console.log(data),
  saving = false,
  isAnswered = false,
  disabled = false,
  darkMode = true,
  theme = {}
}) {
  const [recording, setRecording] = useState(false)
  const [manualText, setManualText] = useState('')
  const mediaRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])

  const {
    transcript,
    browserSupportsSpeechRecognition,
    resetTranscript,
    listening
  } = useSpeechRecognition()

  const finalTranscript = recording ? transcript : manualText;

  useEffect(() => {
    if (recording && transcript) {
      console.log('Transcript updated:', transcript)
    }
  }, [transcript, recording])

  if (!browserSupportsSpeechRecognition) {
    return (
      <div style={{ 
        padding: 20, 
        textAlign: 'center',
        background: theme.bgCard,
        borderRadius: 16,
        border: `1px solid ${theme.border}`
      }}>
        <h3 style={{ color: theme.text }}>Browser doesn't support speech recognition</h3>
        <p style={{ color: theme.textSecondary }}>Please use Google Chrome or Microsoft Edge</p>
      </div>
    )
  }

  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: { width: 1280, height: 720 } 
        })
        if (mediaRef.current) {
          mediaRef.current.srcObject = stream
          mediaRef.current.onloadedmetadata = () => {
            mediaRef.current.play().catch(e => console.log('Play error:', e))
          }
        }
      } catch (err) {
        console.error('Media access error:', err)
        alert('Camera/microphone access denied. Please allow permissions and refresh.')
      }
    }

    startVideo()

    return () => {
      if (mediaRef.current?.srcObject) {
        const stream = mediaRef.current.srcObject
        stream.getTracks().forEach(track => track.stop())
      }
      SpeechRecognition.stopListening()
    }
  }, [])

  const startRec = async () => {
    const stream = mediaRef.current?.srcObject
    if (!stream) {
      alert('Please allow camera and microphone access')
      return
    }
    
    try {
      resetTranscript();
      setManualText('');
      const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' })
      chunksRef.current = []
      
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      
      recorderRef.current = rec
      rec.start()
      setRecording(true)
      SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });
    } catch (err) {
      console.error('Recording error:', err)
      alert('Failed to start recording')
    }
  }

  const handleClear = () => {
    if (recording) {
      resetTranscript()
      setManualText('')
      setTimeout(() => {
        SpeechRecognition.startListening({ 
          continuous: true, 
          language: 'en-IN' 
        })
      }, 100)
    } else {
      resetTranscript()
      setManualText('')
    }
  }

  const handleSaveAndNext = async () => {
    if (!finalTranscript.trim()) {
      alert('Please provide an answer before saving!')
      return
    }
    
    let audioBlob = null
    
    if (recording && recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
      
      await new Promise((resolve) => {
        recorderRef.current.onstop = () => {
          audioBlob = new Blob(chunksRef.current, { type: 'video/webm' })
          setRecording(false)
          resolve()
        }
      })
    }
    
    const currentTranscript = finalTranscript
    
    await onSubmit({ 
      audioBlob: audioBlob, 
      transcript: currentTranscript 
    })
    
    resetTranscript()
    setManualText('')
  }

  return (
    <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 1200 }}>
      <div style={{
        display: 'flex',
        gap: 24,
        width: '100%',
        background: theme.bgCard,
        borderRadius: 16,
        boxShadow: `0 4px 20px ${theme.shadow}`,
        padding: 20,
        boxSizing: 'border-box',
        border: `1px solid ${theme.border}`,
        transition: 'all 0.3s ease'
      }}>
        {/* Video Section */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <video
            ref={mediaRef}
            autoPlay
            muted
            style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: 12, 
              background: '#000', 
              objectFit: 'cover', 
              minHeight: 400,
              border: `1px solid ${theme.border}`
            }}
          />
        </div>

        {/* Answer Section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <textarea
            rows={10}
            value={finalTranscript}
            onChange={(e) => !recording && setManualText(e.target.value)}
            readOnly={recording}
            placeholder={recording ? "Speaking... (transcript appears here)" : "Type your answer OR click 'Start Recording' to speak..."}
            style={{ 
              width: '100%', 
              flex: 1, 
              borderRadius: 12, 
              border: `1px solid ${theme.border}`, 
              padding: 15, 
              resize: 'none', 
              fontSize: 15,
              background: recording ? (darkMode ? '#0A2540' : '#E3F2FD') : theme.bgSecondary,
              color: theme.text,
              cursor: recording ? 'not-allowed' : 'text',
              fontFamily: 'inherit',
              lineHeight: 1.6,
              minHeight: 200,
              transition: 'all 0.2s ease'
            }}
          />

          <div style={{ display: 'flex', gap: 8, marginTop: 15, flexWrap: 'wrap', alignItems: 'center' }}>
            {!recording ? (
              <button
                onClick={startRec}
                disabled={saving || disabled}
                style={{ 
                  padding: '12px 20px', 
                  borderRadius: 12, 
                  border: 'none', 
                  background: (saving || disabled) ? theme.border : theme.success, 
                  color: '#fff', 
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: (saving || disabled) ? 'not-allowed' : 'pointer',
                  opacity: (saving || disabled) ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: (saving || disabled) ? 'none' : `0 4px 12px ${theme.shadow}`
                }}
              >
                🎤 Start Recording
              </button>
            ) : (
              <button
                onClick={() => {
                  if (recorderRef.current && recorderRef.current.state !== 'inactive') {
                    recorderRef.current.stop()
                    setRecording(false)
                  }
                }}
                disabled={disabled}
                style={{ 
                  padding: '12px 20px', 
                  borderRadius: 12, 
                  border: 'none', 
                  background: disabled ? theme.border : theme.error, 
                  color: '#fff', 
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: disabled ? 'none' : `0 4px 12px ${theme.shadow}`
                }}
              >
                ⏹️ Stop Recording
              </button>
            )}

            {/* Save & Next Button */}
            <button
              onClick={handleSaveAndNext}
              disabled={saving || !finalTranscript.trim() || disabled}
              style={{ 
                padding: '12px 24px', 
                borderRadius: 12, 
                border: 'none', 
                background: (saving || !finalTranscript.trim() || disabled) ? theme.border : theme.accent,
                color: '#fff', 
                fontWeight: 600,
                fontSize: 14,
                cursor: (saving || !finalTranscript.trim() || disabled) ? 'not-allowed' : 'pointer',
                opacity: (saving || !finalTranscript.trim() || disabled) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                boxShadow: (saving || !finalTranscript.trim() || disabled) ? 'none' : `0 4px 12px ${theme.shadow}`
              }}
              title={disabled ? "Please wait for feedback" : "Save answer and move to next question"}
            >
              {saving ? '💾 Saving...' : isAnswered ? '✓ Save & Next' : '💾 Save & Next'}
            </button>

            <button
              onClick={handleClear}
              disabled={saving || disabled}
              style={{ 
                padding: '12px 20px', 
                borderRadius: 12, 
                border: `1px solid ${theme.border}`, 
                background: theme.bgCard, 
                color: theme.textSecondary, 
                fontWeight: 500,
                fontSize: 14,
                cursor: (saving || disabled) ? 'not-allowed' : 'pointer',
                opacity: (saving || disabled) ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
              title="Clear text and start over"
            >
              🗑️ Clear
            </button>

            {recording && listening && (
              <span style={{ 
                color: theme.success, 
                fontSize: 14, 
                fontWeight: 600,
                padding: '8px 12px',
                background: darkMode ? theme.success + '20' : '#E8F5E9',
                borderRadius: 12,
                transition: 'all 0.2s ease'
              }}>
                🎤 Listening...
              </span>
            )}

            {saving && (
              <span style={{ 
                color: theme.accent, 
                fontSize: 14, 
                fontWeight: 600,
                padding: '8px 12px',
                background: darkMode ? theme.accent + '20' : '#E3F2FD',
                borderRadius: 12,
                transition: 'all 0.2s ease'
              }}>
                💾 Saving your answer...
              </span>
            )}
          </div>

          <div style={{ 
            fontSize: 13, 
            color: theme.textTertiary, 
            marginTop: 15, 
            lineHeight: 1.5, 
            padding: 12, 
            background: theme.bgSecondary, 
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            transition: 'all 0.3s ease'
          }}>
            💡 <strong style={{ color: theme.textSecondary }}>Tip:</strong> Record or type your answer, then click <strong style={{ color: theme.text }}>"Save & Next"</strong> to move to the next question. Your answer will be saved automatically!
          </div>
        </div>
      </div>
    </div>
  )
}