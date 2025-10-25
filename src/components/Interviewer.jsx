import React, { useEffect, useRef, useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

export default function Interviewer({ 
  question="",
  onSubmit = (data) => console.log(data),
  saving = false,
  isAnswered = false
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
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h3>Browser doesn't support speech recognition</h3>
        <p>Please use Google Chrome or Microsoft Edge</p>
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
    // Check if there's an answer (either typed or recorded)
    if (!finalTranscript.trim()) {
      alert('Please provide an answer before saving!')
      return
    }
    
    let audioBlob = null
    
    // If recording, stop it first
    if (recording && recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
      
      // Wait for recording to stop and create blob
      await new Promise((resolve) => {
        recorderRef.current.onstop = () => {
          audioBlob = new Blob(chunksRef.current, { type: 'video/webm' })
          setRecording(false)
          resolve()
        }
      })
    }
    
    const currentTranscript = finalTranscript
    
    // Submit the answer
    await onSubmit({ 
      audioBlob: audioBlob, 
      transcript: currentTranscript 
    })
    
    // Clear for next question
    resetTranscript()
    setManualText('')
  }

  return (
    <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 1200 }}>
      <div style={{
        display: 'flex',
        gap: 24,
        width: '100%',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        padding: 20,
        boxSizing: 'border-box',
      }}>
        {/* Video Section */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <video
            ref={mediaRef}
            autoPlay
            muted
            style={{ width: '100%', height: '100%', borderRadius: 12, background: '#000', objectFit: 'cover', minHeight: 400 }}
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
              borderRadius: 8, 
              border: '1px solid #ccc', 
              padding: 15, 
              resize: 'none', 
              fontSize: 15,
              background: recording ? '#f0f9ff' : '#fff',
              cursor: recording ? 'not-allowed' : 'text',
              fontFamily: 'inherit',
              lineHeight: 1.6,
              minHeight: 200
            }}
          />

          <div style={{ display: 'flex', gap: 8, marginTop: 15, flexWrap: 'wrap', alignItems: 'center' }}>
            {!recording ? (
              <button
                onClick={startRec}
                disabled={saving}
                style={{ 
                  padding: '12px 20px', 
                  borderRadius: 8, 
                  border: 'none', 
                  background: saving ? '#ccc' : '#4CAF50', 
                  color: '#fff', 
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1
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
                style={{ 
                  padding: '12px 20px', 
                  borderRadius: 8, 
                  border: 'none', 
                  background: '#f44336', 
                  color: '#fff', 
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                ⏹️ Stop Recording
              </button>
            )}

            {/* Save & Next Button */}
            <button
              onClick={handleSaveAndNext}
              disabled={saving || !finalTranscript.trim()}
              style={{ 
                padding: '12px 24px', 
                borderRadius: 8, 
                border: 'none', 
                background: saving ? '#ccc' : finalTranscript.trim() ? '#2196F3' : '#ccc',
                color: '#fff', 
                fontWeight: 600,
                fontSize: 14,
                cursor: saving || !finalTranscript.trim() ? 'not-allowed' : 'pointer',
                opacity: saving || !finalTranscript.trim() ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
              title="Save answer and move to next question"
            >
              {saving ? '💾 Saving...' : isAnswered ? '✓ Save & Next' : '💾 Save & Next'}
            </button>

            <button
              onClick={handleClear}
              disabled={saving}
              style={{ 
                padding: '12px 20px', 
                borderRadius: 8, 
                border: '1px solid #ccc', 
                background: '#fff', 
                color: '#333', 
                fontWeight: 500,
                fontSize: 14,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1
              }}
              title="Clear text and start over"
            >
              🗑️ Clear
            </button>

            {recording && listening && (
              <span style={{ 
                color: '#4CAF50', 
                fontSize: 14, 
                fontWeight: 600,
                padding: '8px 12px',
                background: '#e8f5e9',
                borderRadius: 8
              }}>
                🎤 Listening...
              </span>
            )}

            {saving && (
              <span style={{ 
                color: '#2196F3', 
                fontSize: 14, 
                fontWeight: 600,
                padding: '8px 12px',
                background: '#e3f2fd',
                borderRadius: 8
              }}>
                💾 Saving your answer...
              </span>
            )}
          </div>

          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 15, lineHeight: 1.5, padding: 10, background: '#f5f5f5', borderRadius: 8 }}>
            💡 <strong>Tip:</strong> Record or type your answer, then click <strong>"Save & Next"</strong> to move to the next question. Your answer will be saved automatically!
          </div>
        </div>
      </div>
    </div>
  )
}