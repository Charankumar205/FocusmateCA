"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { postEvent } from "../api"

const WebcamMonitor = ({ sessionId, onFocusChange, isActive }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)
  const previousFrameRef = useRef(null)

  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [error, setError] = useState(null)
  const [presenceStatus, setPresenceStatus] = useState("present")
  const [confidence, setConfidence] = useState(0)

  // Webcam initialization
  const initializeWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 500,
          facingMode: "user",
        },
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsWebcamActive(true)
        setError(null)
      }
    } catch (err) {
      console.error("Webcam access error:", err)
      setError("Unable to access webcam. Please check permissions.")
      setIsWebcamActive(false)
    }
  }, [])

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsWebcamActive(false)
  }, [])

  // Simple presence detection algorithm
  const detectPresence = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isWebcamActive) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const currentFrame = imageData.data

    if (previousFrameRef.current) {
      // Calculate frame difference and brightness
      const { movement, brightness } = analyzeFrame(currentFrame, previousFrameRef.current)

      // Simple heuristic for presence detection
      // You can enhance this with more sophisticated algorithms
      const isPresent = detectPresenceHeuristic(movement, brightness)
      const confidenceScore = calculateConfidence(movement, brightness)

      setConfidence(confidenceScore)

      const newStatus = isPresent ? "present" : "distracted"
      if (newStatus !== presenceStatus) {
        setPresenceStatus(newStatus)
        onFocusChange(newStatus)

        // Send event to backend
        if (sessionId) {
          postEvent(sessionId, newStatus, {
            confidence: confidenceScore,
            movement,
            brightness,
          }).catch(console.error)
        }
      }
    }

    // Store current frame for next comparison
    previousFrameRef.current = new Uint8ClampedArray(currentFrame)
  }, [sessionId, onFocusChange, presenceStatus, isWebcamActive])

  // Frame analysis helper functions
  const analyzeFrame = (currentFrame, previousFrame) => {
    let totalDifference = 0
    let totalBrightness = 0
    const pixelCount = currentFrame.length / 4

    for (let i = 0; i < currentFrame.length; i += 4) {
      // Calculate brightness (grayscale)
      const currentBrightness = (currentFrame[i] + currentFrame[i + 1] + currentFrame[i + 2]) / 3
      const previousBrightness = (previousFrame[i] + previousFrame[i + 1] + previousFrame[i + 2]) / 3

      totalBrightness += currentBrightness
      totalDifference += Math.abs(currentBrightness - previousBrightness)
    }

    return {
      movement: totalDifference / pixelCount,
      brightness: totalBrightness / pixelCount,
    }
  }

  const detectPresenceHeuristic = (movement, brightness) => {
    // Simple heuristic - adjust thresholds based on testing
    const MOVEMENT_THRESHOLD = 5 // Minimum movement to indicate presence
    const BRIGHTNESS_MIN = 30 // Minimum brightness (not too dark)
    const BRIGHTNESS_MAX = 200 // Maximum brightness (not overexposed)

    // Person is likely present if:
    // 1. There's some movement (but not too much - could indicate distraction)
    // 2. Lighting conditions are reasonable
    const hasMovement = movement > MOVEMENT_THRESHOLD && movement < 50
    const goodLighting = brightness > BRIGHTNESS_MIN && brightness < BRIGHTNESS_MAX

    return hasMovement && goodLighting
  }

  const calculateConfidence = (movement, brightness) => {
    // Calculate confidence score (0-100)
    let score = 50 // Base score

    // Adjust based on movement
    if (movement > 5 && movement < 20) {
      score += 30 // Good movement range
    } else if (movement > 20) {
      score -= 20 // Too much movement (distracted?)
    }

    // Adjust based on lighting
    if (brightness > 50 && brightness < 150) {
      score += 20 // Good lighting
    }

    return Math.max(0, Math.min(100, score))
  }

  // Start monitoring when session is active
  useEffect(() => {
    if (isActive && isWebcamActive) {
      intervalRef.current = setInterval(detectPresence, 1000) // Check every second
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, isWebcamActive, detectPresence])

  // Initialize webcam when component mounts
  useEffect(() => {
    if (isActive) {
      initializeWebcam()
    }

    return () => {
      stopWebcam()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, initializeWebcam, stopWebcam])

  return (
    <div className="webcam-monitor">
      <div className="monitor-header">
        <h3>Webcam Monitor</h3>
        <div className={`status-badge ${presenceStatus}`}>
          {presenceStatus === "present" ? "👁️ Present" : "😴 Distracted"}
        </div>
      </div>

      <div className="webcam-container">
        {error ? (
          <div className="webcam-error">
            <p>{error}</p>
            <button onClick={initializeWebcam} className="btn btn-secondary">
              Retry Webcam Access
            </button>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay muted playsInline className="webcam-video" />
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </>
        )}
      </div>

      <div className="monitor-stats">
        <div className="stat">
          <label>Status:</label>
          <span className={presenceStatus}>{presenceStatus}</span>
        </div>
        <div className="stat">
          <label>Confidence:</label>
          <span>{confidence}%</span>
        </div>
        <div className="stat">
          <label>Webcam:</label>
          <span className={isWebcamActive ? "active" : "inactive"}>{isWebcamActive ? "Active" : "Inactive"}</span>
        </div>
      </div>

      <div className="monitor-info">
        <h4>How it works:</h4>
        <ul>
          <li>Analyzes video frames for movement and lighting</li>
          <li>Detects when you're present vs. distracted</li>
          <li>Uses simple computer vision algorithms</li>
          <li>Can be enhanced with face-api.js for face detection</li>
        </ul>

        {/* 
        Optional face-api.js integration suggestions:
        
        To enhance with face detection:
        1. Install face-api.js: npm install face-api.js
        2. Load models in useEffect:
           await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
           await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
        3. Replace simple heuristic with:
           const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
           const isPresent = detections.length > 0
        4. Add face landmark analysis for attention detection
        */}
      </div>
    </div>
  )
}

export default WebcamMonitor
