import React, { useEffect, useRef, useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import * as blazeface from '@tensorflow-models/blazeface'
import * as tf from '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'

export default function Interviewer({ 
  question="",
  onSubmit = (data) => console.log(data),
  saving = false,
  isAnswered = false,
  disabled = false,
  darkMode = true,
  theme = {},
  practiceMode = false
}) {
  const [recording, setRecording] = useState(false)
  const [manualText, setManualText] = useState('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [cropFaceOnly, setCropFaceOnly] = useState(false)
  const [faceDetectionAvailable, setFaceDetectionAvailable] = useState(false)
  const mediaRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const frameCaptureIntervalRef = useRef(null)
  const capturedFramesRef = useRef([])
  const timerIntervalRef = useRef(null)
  const faceDetectorRef = useRef(null)
  const blazeModelRef = useRef(null)
  const detectorTypeRef = useRef('none')
  const lastFaceBoxRef = useRef(null)
  const cropFaceOnlyRef = useRef(cropFaceOnly)
  const previewCanvasRef = useRef(null)

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
      if (frameCaptureIntervalRef.current) {
        clearInterval(frameCaptureIntervalRef.current)
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      if (mediaRef.current?.srcObject) {
        const stream = mediaRef.current.srcObject
        stream.getTracks().forEach(track => track.stop())
      }
      SpeechRecognition.stopListening()
    }
  }, [])

  useEffect(() => {
    cropFaceOnlyRef.current = cropFaceOnly
    if (!cropFaceOnly && previewCanvasRef.current) {
      const ctx = previewCanvasRef.current.getContext('2d')
      ctx && ctx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height)
    }
  }, [cropFaceOnly])

  useEffect(() => {
    if (!cropFaceOnly || !previewCanvasRef.current || !mediaRef.current) return
    
    let animationFrameId = null
    let cancelled = false
    let lastDetectionTime = 0
    const DETECTION_INTERVAL = 500 // Detect face every 500ms
    
    const updatePreview = async () => {
      if (cancelled || !cropFaceOnlyRef.current || !mediaRef.current || !previewCanvasRef.current) return
      
      try {
        const video = mediaRef.current
        if (video.readyState < 2) {
          animationFrameId = requestAnimationFrame(updatePreview)
          return
        }
        
        const now = Date.now()
        const shouldDetect = (now - lastDetectionTime) > DETECTION_INTERVAL
        
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        let cropped
        if (shouldDetect) {
          cropped = await cropCanvasToFace(canvas)
          lastDetectionTime = now
        } else {
          // Use last known face box for faster updates
          const box = lastFaceBoxRef.current
          if (box) {
            const pad = Math.max(box.width, box.height) * 0.35
            const sx = Math.max(0, Math.floor(box.x - pad))
            const sy = Math.max(0, Math.floor(box.y - pad))
            const ex = Math.min(canvas.width, Math.ceil(box.x + box.width + pad))
            const ey = Math.min(canvas.height, Math.ceil(box.y + box.height + pad))
            const sw = Math.max(1, ex - sx)
            const sh = Math.max(1, ey - sy)
            const tempCropped = document.createElement('canvas')
            tempCropped.width = 320
            tempCropped.height = 320
            const tempCtx = tempCropped.getContext('2d')
            tempCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, tempCropped.width, tempCropped.height)
            cropped = tempCropped
          } else {
            cropped = cropToCenteredRegion(canvas)
          }
        }
        
        if (cancelled || !previewCanvasRef.current) return
        
        const previewCtx = previewCanvasRef.current.getContext('2d')
        const container = previewCanvasRef.current.parentElement
        if (container) {
          const containerWidth = container.clientWidth
          const containerHeight = container.clientHeight
          previewCanvasRef.current.width = containerWidth
          previewCanvasRef.current.height = containerHeight
          previewCtx.clearRect(0, 0, containerWidth, containerHeight)
          previewCtx.drawImage(cropped, 0, 0, containerWidth, containerHeight)
        }
      } catch (err) {
        console.warn('Preview update error:', err)
      }
      
      if (!cancelled) {
        animationFrameId = requestAnimationFrame(updatePreview)
      }
    }
    
    updatePreview()
    
    return () => {
      cancelled = true
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [cropFaceOnly])

  useEffect(() => {
    let cancelled = false
    const initDetectors = async () => {
      if (typeof window === 'undefined' || cancelled) return
      if ('FaceDetector' in window) {
        try {
          faceDetectorRef.current = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 })
          detectorTypeRef.current = 'native'
          setFaceDetectionAvailable(true)
          return
        } catch (err) {
          console.warn('FaceDetector initialization failed:', err)
          faceDetectorRef.current = null
        }
      }
      try {
        await tf.setBackend('webgl')
        await tf.ready()
        const model = await blazeface.load()
        if (cancelled) return
        blazeModelRef.current = model
        detectorTypeRef.current = 'blaze'
        setFaceDetectionAvailable(true)
      } catch (err) {
        console.warn('BlazeFace load failed:', err)
        blazeModelRef.current = null
        detectorTypeRef.current = 'none'
        setFaceDetectionAvailable(false)
      }
    }
    initDetectors()
    return () => {
      cancelled = true
    }
  }, [])

  const cropToCenteredRegion = (canvas) => {
    const size = Math.min(canvas.width, canvas.height)
    const sx = Math.max(0, Math.floor((canvas.width - size) / 2))
    const sy = Math.max(0, Math.floor((canvas.height - size) / 2 - size * 0.1))
    const cropped = document.createElement('canvas')
    cropped.width = 320
    cropped.height = 320
    const ctx = cropped.getContext('2d')
    ctx.drawImage(canvas, sx, Math.max(0, sy), size, size, 0, 0, cropped.width, cropped.height)
    return cropped
  }

  const cropCanvasToFace = async (canvas) => {
    let box = null
    if (detectorTypeRef.current === 'native' && faceDetectorRef.current) {
      try {
        const faces = await faceDetectorRef.current.detect(canvas)
        if (faces && faces.length) {
          box = faces[0].boundingBox || faces[0]
          lastFaceBoxRef.current = box
        }
      } catch (err) {
        console.warn('Face detection failed:', err)
      }
    } else if (detectorTypeRef.current === 'blaze' && blazeModelRef.current) {
      try {
        const predictions = await blazeModelRef.current.estimateFaces(canvas, false)
        if (predictions && predictions.length) {
          const first = predictions[0]
          const topLeft = first.topLeft
          const bottomRight = first.bottomRight
          const [x1, y1] = Array.isArray(topLeft) ? topLeft : [topLeft[0], topLeft[1]]
          const [x2, y2] = Array.isArray(bottomRight) ? bottomRight : [bottomRight[0], bottomRight[1]]
          box = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }
          lastFaceBoxRef.current = box
        }
      } catch (err) {
        console.warn('BlazeFace detection failed:', err)
      }
    }
    if (!box && lastFaceBoxRef.current) {
      box = lastFaceBoxRef.current
    }
    if (!box) {
      return cropToCenteredRegion(canvas)
    }
    const pad = Math.max(box.width, box.height) * 0.35
    const sx = Math.max(0, Math.floor(box.x - pad))
    const sy = Math.max(0, Math.floor(box.y - pad))
    const ex = Math.min(canvas.width, Math.ceil(box.x + box.width + pad))
    const ey = Math.min(canvas.height, Math.ceil(box.y + box.height + pad))
    const sw = Math.max(1, ex - sx)
    const sh = Math.max(1, ey - sy)
    const cropped = document.createElement('canvas')
    cropped.width = 320
    cropped.height = 320
    const ctx = cropped.getContext('2d')
    ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, cropped.width, cropped.height)
    return cropped
  }

  const captureFrame = async () => {
    if (mediaRef.current && mediaRef.current.readyState === 4) {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = mediaRef.current.videoWidth || 640
        canvas.height = mediaRef.current.videoHeight || 480
        const ctx = canvas.getContext('2d')
        ctx.drawImage(mediaRef.current, 0, 0, canvas.width, canvas.height)
        let workingCanvas = canvas
        if (cropFaceOnlyRef.current) {
          workingCanvas = await cropCanvasToFace(canvas)
        }
        
        // Convert to base64
        const base64Image = workingCanvas.toDataURL('image/jpeg', 0.8)
        capturedFramesRef.current.push(base64Image)
        
        // Keep only last 10 frames (to avoid memory issues)
        if (capturedFramesRef.current.length > 10) {
          capturedFramesRef.current.shift()
        }
      } catch (err) {
        console.error('Frame capture error:', err)
      }
    }
  }

  const startRec = async () => {
    const stream = mediaRef.current?.srcObject
    if (!stream) {
      alert('Please allow camera and microphone access')
      return
    }
    
    try {
      resetTranscript();
      setManualText('');
      capturedFramesRef.current = [] // Reset frames
      setElapsedTime(0) // Reset timer
      
      const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' })
      chunksRef.current = []
      
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      
      recorderRef.current = rec
      rec.start()
      setRecording(true)
      SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });
      
      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
      
      // Start capturing frames every 2 seconds
      frameCaptureIntervalRef.current = setInterval(() => {
        captureFrame().catch(err => console.error('Frame capture error:', err))
      }, 2000)
      
      // Capture initial frame
      setTimeout(() => {
        captureFrame().catch(err => console.error('Frame capture error:', err))
      }, 500)
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
    
    if (practiceMode) {
      alert('Practice mode is read-only. Generate interview questions to save your answers.')
      return
    }
    
    let audioBlob = null
    let videoFrames = []
    
    // Stop frame capture
    if (frameCaptureIntervalRef.current) {
      clearInterval(frameCaptureIntervalRef.current)
      frameCaptureIntervalRef.current = null
    }
    
    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    
    // Capture final frame
    if (recording) {
      await captureFrame().catch(err => console.error('Final frame capture error:', err))
    }
    
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
    
    // Get captured frames (sample every other frame to reduce payload size)
    videoFrames = capturedFramesRef.current.filter((_, index) => index % 2 === 0)
    if (videoFrames.length === 0 && capturedFramesRef.current.length > 0) {
      videoFrames = [capturedFramesRef.current[0]] // At least send one frame
    }
    
    const currentTranscript = finalTranscript
    
    await onSubmit({ 
      audioBlob: audioBlob, 
      transcript: currentTranscript,
      videoFrames: videoFrames,
      cropFaceOnly
    })
    
    resetTranscript()
    setManualText('')
    capturedFramesRef.current = [] // Clear frames after submission
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ 
            flex: 1, 
            position: 'relative', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}>
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
                border: `1px solid ${theme.border}`,
                opacity: cropFaceOnly ? 0 : 1,
                transition: 'opacity 0.2s ease'
              }}
            />
            <canvas
              ref={previewCanvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: 12,
                border: `1px solid ${theme.border}`,
                display: cropFaceOnly ? 'block' : 'none',
                background: '#000',
                objectFit: 'cover',
                zIndex: 1
              }}
            />
            {cropFaceOnly && (
              <div style={{
                position: 'absolute',
                top: 16,
                right: 16,
                padding: '6px 12px',
                borderRadius: 999,
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.5px'
              }}>
                Cropping enabled
              </div>
            )}
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: 12,
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            background: theme.bgSecondary
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, color: theme.text }}>
              <input
                type="checkbox"
                checked={cropFaceOnly}
                onChange={(e) => setCropFaceOnly(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              Crop video to face before analysis
            </label>
            <span style={{ fontSize: 12, color: theme.textSecondary }}>
              {cropFaceOnly
                ? (faceDetectionAvailable
                    ? 'Auto face detection is active. Only the detected face is recorded.'
                    : 'FaceDetector unavailable. Falling back to a centered crop.')
                : 'Send the raw frame without cropping.'}
            </span>
          </div>
        </div>

        {/* Answer Section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {practiceMode && (
            <div style={{
              marginBottom: 12,
              padding: 12,
              borderRadius: 12,
              border: `1px solid ${theme.warning}`,
              background: darkMode ? theme.warning + '15' : '#FFF3E0',
              color: theme.warning,
              fontWeight: 600,
              fontSize: 14
            }}>
              Practice mode is for testing audio/video only. Saving answers is disabled here.
            </div>
          )}

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
                Start Recording
              </button>
            ) : (
              <button
                onClick={() => {
                  if (recorderRef.current && recorderRef.current.state !== 'inactive') {
                    recorderRef.current.stop()
                    setRecording(false)
                  }
                  // Stop timer
                  if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current)
                    timerIntervalRef.current = null
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
                Stop Recording
              </button>
            )}

            {/* Timer Display */}
            {recording && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 16px',
                background: darkMode ? theme.error + '20' : '#FFEBEE',
                borderRadius: 12,
                border: `2px solid ${theme.error}`,
                fontWeight: 600,
                fontSize: 16,
                color: theme.error,
                minWidth: 100,
                justifyContent: 'center'
              }}>
                <span>
                  {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:
                  {(elapsedTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}

            {/* Save & Next Button */}
            <button
              onClick={handleSaveAndNext}
              disabled={practiceMode || saving || !finalTranscript.trim() || disabled}
              style={{ 
                padding: '12px 24px', 
                borderRadius: 12, 
                border: 'none', 
                background: (practiceMode || saving || !finalTranscript.trim() || disabled) ? theme.border : theme.accent,
                color: '#fff', 
                fontWeight: 600,
                fontSize: 14,
                cursor: (practiceMode || saving || !finalTranscript.trim() || disabled) ? 'not-allowed' : 'pointer',
                opacity: (practiceMode || saving || !finalTranscript.trim() || disabled) ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                boxShadow: (practiceMode || saving || !finalTranscript.trim() || disabled) ? 'none' : `0 4px 12px ${theme.shadow}`
              }}
              title={
                practiceMode
                  ? "Practice mode is read-only"
                  : disabled
                    ? "Please wait for feedback"
                    : "Save answer and move to next question"
              }
            >
              {practiceMode
                ? 'Save Disabled (Practice Mode)'
                : saving
                  ? 'Saving...'
                  : 'Save & Next'}
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
                Clear
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
                Listening...
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
                Saving your answer...
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
            <strong style={{ color: theme.textSecondary }}>Tip:</strong> Record or type your answer, then click <strong style={{ color: theme.text }}>"Save & Next"</strong> to move to the next question. Your answer will be saved automatically!
          </div>
        </div>
      </div>
    </div>
  )
}