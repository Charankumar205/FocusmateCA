"use client"

import { useState, useEffect } from "react"
import { startSession, endSession } from "../api"

const SessionStarter = ({ currentSession, onSessionStart, onSessionEnd }) => {
  const [loading, setLoading] = useState(false)
  const [showCountdownInput, setShowCountdownInput] = useState(false)
  const [countdownMinutes, setCountdownMinutes] = useState(25)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [isCountdownActive, setIsCountdownActive] = useState(false)

  // Countdown timer effect
  useEffect(() => {
    let interval = null

    if (isCountdownActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((time) => {
          if (time <= 1) {
            setIsCountdownActive(false)
            // Auto-end session when countdown reaches zero
            if (currentSession) {
              handleEndSession()
            }
            // Show completion notification
            showCountdownComplete()
            return 0
          }
          return time - 1
        })
      }, 1000)
    } else if (!isCountdownActive) {
      clearInterval(interval)
    }

    return () => clearInterval(interval)
  }, [isCountdownActive, timeRemaining, currentSession])

  const showCountdownComplete = () => {
    // Create a beautiful completion notification
    const notification = document.createElement("div")
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10000;
      background: rgba(26, 26, 46, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 3rem;
      border: 2px solid #06ffa5;
      box-shadow: 0 0 50px rgba(6, 255, 165, 0.5), 0 25px 50px rgba(0, 0, 0, 0.7);
      animation: notificationAppear 0.5s ease-out;
      text-align: center;
      color: white;
    `
    notification.innerHTML = `
      <div style="font-size: 4rem; margin-bottom: 1rem; animation: bounce 1s ease-in-out infinite;">🎉</div>
      <h3 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 1rem; color: #06ffa5; text-shadow: 0 0 20px #06ffa5;">Focus Session Complete!</h3>
      <p style="font-size: 1.1rem; color: rgba(255, 255, 255, 0.9); line-height: 1.5;">Great job! You've completed your ${countdownMinutes}-minute focus session.</p>
    `
    document.body.appendChild(notification)

    // Add keyframes for animations
    if (!document.getElementById("countdown-animations")) {
      const style = document.createElement("style")
      style.id = "countdown-animations"
      style.textContent = `
        @keyframes notificationAppear {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
      `
      document.head.appendChild(style)
    }

    setTimeout(() => {
      notification.remove()
    }, 5000)
  }

  const handleStartSession = async () => {
    setLoading(true)
    try {
      const response = await startSession()
      onSessionStart(response.session)

      // Start countdown if enabled
      if (showCountdownInput && countdownMinutes > 0) {
        setTimeRemaining(countdownMinutes * 60)
        setIsCountdownActive(true)
      }

      setShowCountdownInput(false)
    } catch (error) {
      console.error("Failed to start session:", error)
      alert("Failed to start session. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleEndSession = async () => {
    if (!currentSession) return

    setLoading(true)
    try {
      await endSession(currentSession.id)
      onSessionEnd()
      setIsCountdownActive(false)
      setTimeRemaining(null)
    } catch (error) {
      console.error("Failed to end session:", error)
      alert("Failed to end session. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const getCountdownColor = () => {
    if (!timeRemaining) return "#00d4ff"
    const percentage = (timeRemaining / (countdownMinutes * 60)) * 100
    if (percentage > 50) return "#06ffa5"
    if (percentage > 25) return "#fb8500"
    return "#ff006e"
  }

  const getCountdownPercentage = () => {
    if (!timeRemaining || !countdownMinutes) return 100
    return (timeRemaining / (countdownMinutes * 60)) * 100
  }

  const countdownDisplayStyle = {
    background: "rgba(26, 26, 46, 0.8)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "2.5rem",
    marginBottom: "2rem",
    textAlign: "center",
    border: "2px solid #06ffa5",
    boxShadow: "0 0 30px rgba(6, 255, 165, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
    position: "relative",
    overflow: "hidden",
    animation: "countdownGlow 3s ease-in-out infinite",
  }

  const countdownCircleStyle = {
    position: "relative",
    width: "200px",
    height: "200px",
    margin: "0 auto 2rem",
  }

  const countdownTimeStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
  }

  const countdownNumberStyle = {
    display: "block",
    fontSize: "2.5rem",
    fontWeight: "900",
    color: "white",
    textShadow: "0 0 20px rgba(255, 255, 255, 0.5)",
    marginBottom: "0.25rem",
    fontFamily: '"Courier New", monospace',
  }

  const countdownLabelStyle = {
    display: "block",
    fontSize: "0.9rem",
    color: "#06ffa5",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: "600",
    textShadow: "0 0 10px #06ffa5",
  }

  const toggleSwitchStyle = {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    cursor: "pointer",
    userSelect: "none",
    marginBottom: "2rem",
  }

  const toggleSliderStyle = {
    position: "relative",
    width: "60px",
    height: "30px",
    background: showCountdownInput ? "linear-gradient(135deg, #00d4ff 0%, #090979 100%)" : "#16213e",
    borderRadius: "15px",
    transition: "all 0.3s ease-out",
    border: `2px solid ${showCountdownInput ? "#00d4ff" : "rgba(0, 212, 255, 0.3)"}`,
    boxShadow: showCountdownInput ? "0 0 20px rgba(0, 212, 255, 0.4)" : "inset 0 0 10px rgba(0, 0, 0, 0.3)",
  }

  const toggleSliderBeforeStyle = {
    content: '""',
    position: "absolute",
    top: "2px",
    left: showCountdownInput ? "32px" : "2px",
    width: "22px",
    height: "22px",
    background: "white",
    borderRadius: "50%",
    transition: "all 0.3s ease-out",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
  }

  const inputWithControlsStyle = {
    display: "flex",
    alignItems: "center",
    gap: "0",
    marginBottom: "1.5rem",
    background: "rgba(26, 26, 46, 0.8)",
    borderRadius: "16px",
    padding: "0.5rem",
    border: "2px solid rgba(0, 212, 255, 0.3)",
    boxShadow: "0 0 20px rgba(0, 212, 255, 0.2)",
  }

  const inputControlStyle = {
    width: "50px",
    height: "50px",
    border: "none",
    background: "linear-gradient(135deg, #00d4ff 0%, #090979 100%)",
    color: "white",
    fontSize: "1.5rem",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease-out",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    textShadow: "0 0 10px rgba(255, 255, 255, 0.8)",
    boxShadow: "0 0 15px rgba(0, 212, 255, 0.3)",
  }

  const countdownInputStyle = {
    flex: "1",
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "2rem",
    fontWeight: "900",
    textAlign: "center",
    padding: "1rem",
    fontFamily: '"Courier New", monospace',
    textShadow: "0 0 15px rgba(255, 255, 255, 0.5)",
    outline: "none",
  }

  const presetButtonsStyle = {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
  }

  const presetBtnStyle = (isActive) => ({
    padding: "0.75rem 1.5rem",
    background: isActive ? "linear-gradient(135deg, #00d4ff 0%, #090979 100%)" : "#16213e",
    color: isActive ? "white" : "rgba(255, 255, 255, 0.8)",
    border: `2px solid ${isActive ? "#00d4ff" : "rgba(255, 255, 255, 0.2)"}`,
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease-out",
    fontWeight: "600",
    fontSize: "0.9rem",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    boxShadow: isActive ? "0 0 20px rgba(0, 212, 255, 0.4)" : "none",
    textShadow: isActive ? "0 0 10px rgba(255, 255, 255, 0.8)" : "none",
  })

  return (
    <div className="session-starter">
      {/* Countdown Timer Display */}
      {currentSession && isCountdownActive && timeRemaining !== null && (
        <div style={countdownDisplayStyle}>
          <div style={countdownCircleStyle}>
            <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={getCountdownColor()}
                strokeWidth="8"
                strokeLinecap="round"
                style={{
                  strokeDasharray: `${2 * Math.PI * 45}`,
                  strokeDashoffset: `${2 * Math.PI * 45 * (1 - getCountdownPercentage() / 100)}`,
                  transition: "stroke-dashoffset 1s ease-in-out, stroke 0.3s ease",
                  filter: `drop-shadow(0 0 8px ${getCountdownColor()})`,
                }}
              />
            </svg>
            <div style={countdownTimeStyle}>
              <span style={countdownNumberStyle}>{formatTime(timeRemaining)}</span>
              <span style={countdownLabelStyle}>remaining</span>
            </div>
          </div>
          <div style={{ color: "white" }}>
            <h4
              style={{
                marginBottom: "0.5rem",
                fontSize: "1.3rem",
                fontWeight: "700",
                textShadow: "0 0 15px rgba(255, 255, 255, 0.3)",
              }}
            >
              Focus Session in Progress
            </h4>
            <p
              style={{
                color: "#06ffa5",
                fontSize: "1rem",
                fontWeight: "500",
                textShadow: "0 0 10px rgba(6, 255, 165, 0.5)",
              }}
            >
              Stay focused! You're doing great.
            </p>
          </div>
        </div>
      )}

      <div className="session-status">
        {currentSession ? (
          <div className="active-session">
            <div className="status-indicator active"></div>
            <div className="session-info">
              <h3>Focus Session Active</h3>
              <p>Started at {new Date(currentSession.startedAt).toLocaleTimeString()}</p>
              {isCountdownActive && (
                <p style={{ color: "#06ffa5", fontWeight: "600", textShadow: "0 0 10px #06ffa5", marginTop: "0.5rem" }}>
                  🎯 {countdownMinutes}-minute focus session
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="inactive-session">
            <div className="status-indicator inactive"></div>
            <div className="session-info">
              <h3>Ready to Focus</h3>
              <p>Start a new session to begin monitoring</p>
            </div>
          </div>
        )}
      </div>

      {/* Countdown Input Section */}
      {!currentSession && (
        <div
          style={{
            background: "rgba(26, 26, 46, 0.8)",
            borderRadius: "20px",
            padding: "2rem",
            marginBottom: "2rem",
            border: "1px solid rgba(0, 212, 255, 0.2)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={toggleSwitchStyle}>
            <div style={toggleSliderStyle} onClick={() => setShowCountdownInput(!showCountdownInput)}>
              <div style={toggleSliderBeforeStyle}></div>
            </div>
            <span
              style={{
                color: "white",
                fontSize: "1.1rem",
                fontWeight: "600",
                textShadow: "0 0 10px rgba(255, 255, 255, 0.3)",
              }}
            >
              Set Focus Timer
            </span>
          </div>

          {showCountdownInput && (
            <div style={{ animation: "slideInUp 0.5s ease-out" }}>
              <label
                style={{
                  display: "block",
                  color: "#00d4ff",
                  fontSize: "1rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  textShadow: "0 0 10px rgba(0, 212, 255, 0.5)",
                }}
              >
                Focus Duration (minutes)
              </label>

              <div style={inputWithControlsStyle}>
                <button
                  type="button"
                  style={inputControlStyle}
                  onClick={() => setCountdownMinutes(Math.max(1, countdownMinutes - 5))}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "scale(1.1)"
                    e.target.style.boxShadow = "0 0 25px rgba(0, 212, 255, 0.5)"
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "scale(1)"
                    e.target.style.boxShadow = "0 0 15px rgba(0, 212, 255, 0.3)"
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={countdownMinutes}
                  onChange={(e) => setCountdownMinutes(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  style={countdownInputStyle}
                />
                <button
                  type="button"
                  style={inputControlStyle}
                  onClick={() => setCountdownMinutes(Math.min(180, countdownMinutes + 5))}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "scale(1.1)"
                    e.target.style.boxShadow = "0 0 25px rgba(0, 212, 255, 0.5)"
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "scale(1)"
                    e.target.style.boxShadow = "0 0 15px rgba(0, 212, 255, 0.3)"
                  }}
                >
                  +
                </button>
              </div>

              <div style={presetButtonsStyle}>
                {[15, 25, 45, 60].map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    style={presetBtnStyle(countdownMinutes === minutes)}
                    onClick={() => setCountdownMinutes(minutes)}
                    onMouseEnter={(e) => {
                      if (countdownMinutes !== minutes) {
                        e.target.style.background = "rgba(26, 26, 46, 0.8)"
                        e.target.style.color = "white"
                        e.target.style.borderColor = "#00d4ff"
                        e.target.style.transform = "translateY(-2px)"
                        e.target.style.boxShadow = "0 0 15px rgba(0, 212, 255, 0.3)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (countdownMinutes !== minutes) {
                        e.target.style.background = "#16213e"
                        e.target.style.color = "rgba(255, 255, 255, 0.8)"
                        e.target.style.borderColor = "rgba(255, 255, 255, 0.2)"
                        e.target.style.transform = "translateY(0)"
                        e.target.style.boxShadow = "none"
                      }
                    }}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>

              <p
                style={{
                  textAlign: "center",
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: "1rem",
                  fontWeight: "500",
                  background: "rgba(0, 212, 255, 0.1)",
                  padding: "1rem",
                  borderRadius: "12px",
                  border: "1px solid rgba(0, 212, 255, 0.3)",
                }}
              >
                ⏱️ Your focus session will last{" "}
                <strong style={{ color: "#00d4ff", textShadow: "0 0 10px #00d4ff" }}>{countdownMinutes} minutes</strong>
              </p>
            </div>
          )}
        </div>
      )}

      <div className="session-controls">
        {currentSession ? (
          <button onClick={handleEndSession} disabled={loading} className="btn btn-danger">
            {loading ? "Ending..." : "End Session"}
          </button>
        ) : (
          <button onClick={handleStartSession} disabled={loading} className="btn btn-primary">
            {loading
              ? "Starting..."
              : showCountdownInput
                ? `Start ${countdownMinutes}min Focus`
                : "Start Focus Session"}
          </button>
        )}
      </div>

      <div className="session-tips">
        <h4>Tips for Better Focus:</h4>
        <ul>
          <li>Find a quiet, well-lit environment</li>
          <li>Position your camera at eye level</li>
          <li>Minimize distractions around you</li>
          <li>Take breaks every 25-30 minutes</li>
          <li>Use the Pomodoro Technique (25min focus + 5min break)</li>
        </ul>
      </div>
    </div>
  )
}

export default SessionStarter
