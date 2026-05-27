"use client"

import { useState, useEffect } from "react"

const FocusFeedback = ({ focusState, sessionId }) => {
  const [sessionStats, setSessionStats] = useState({
    totalTime: 0,
    focusedTime: 0,
    distractedTime: 0,
    distractionCount: 0,
  })
  const [currentStreak, setCurrentStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)

  // Update session stats based on focus state changes
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionStats((prev) => {
        const newStats = { ...prev }
        newStats.totalTime += 1

        if (focusState === "present") {
          newStats.focusedTime += 1
          setCurrentStreak((streak) => {
            const newStreak = streak + 1
            setBestStreak((best) => Math.max(best, newStreak))
            return newStreak
          })
        } else {
          newStats.distractedTime += 1
          if (currentStreak > 0) {
            newStats.distractionCount += 1
            setCurrentStreak(0)
          }
        }

        return newStats
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [focusState, currentStreak])

  // Reset stats when session changes
  useEffect(() => {
    if (sessionId) {
      setSessionStats({
        totalTime: 0,
        focusedTime: 0,
        distractedTime: 0,
        distractionCount: 0,
      })
      setCurrentStreak(0)
      setBestStreak(0)
    }
  }, [sessionId])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getFocusPercentage = () => {
    if (sessionStats.totalTime === 0) return 0
    return Math.round((sessionStats.focusedTime / sessionStats.totalTime) * 100)
  }

  const getFeedbackMessage = () => {
    const focusPercentage = getFocusPercentage()

    if (focusState === "distracted") {
      return {
        message: "You seem distracted. Let's refocus!",
        type: "warning",
        emoji: "😴",
      }
    }

    if (focusPercentage >= 90) {
      return {
        message: "Excellent focus! Keep it up!",
        type: "excellent",
        emoji: "🔥",
      }
    } else if (focusPercentage >= 75) {
      return {
        message: "Great focus! You're doing well!",
        type: "good",
        emoji: "👍",
      }
    } else if (focusPercentage >= 50) {
      return {
        message: "Good effort! Try to minimize distractions.",
        type: "okay",
        emoji: "👌",
      }
    } else {
      return {
        message: "Let's work on improving focus.",
        type: "needs-improvement",
        emoji: "💪",
      }
    }
  }

  const feedback = getFeedbackMessage()

  return (
    <div className="focus-feedback">
      <div className="feedback-header">
        <h3>Focus Feedback</h3>
        <div className={`current-status ${focusState}`}>
          <span className="status-emoji">{focusState === "present" ? "👁️" : "😴"}</span>
          <span className="status-text">{focusState === "present" ? "Focused" : "Distracted"}</span>
        </div>
      </div>

      <div className={`feedback-message ${feedback.type}`}>
        <span className="feedback-emoji">{feedback.emoji}</span>
        <p>{feedback.message}</p>
      </div>

      <div className="session-metrics">
        <div className="metric-grid">
          <div className="metric">
            <div className="metric-value">{formatTime(sessionStats.totalTime)}</div>
            <div className="metric-label">Total Time</div>
          </div>

          <div className="metric">
            <div className="metric-value">{formatTime(sessionStats.focusedTime)}</div>
            <div className="metric-label">Focused Time</div>
          </div>

          <div className="metric">
            <div className="metric-value">{getFocusPercentage()}%</div>
            <div className="metric-label">Focus Score</div>
          </div>

          <div className="metric">
            <div className="metric-value">{sessionStats.distractionCount}</div>
            <div className="metric-label">Distractions</div>
          </div>
        </div>
      </div>

      <div className="focus-progress">
        <div className="progress-header">
          <span>Focus Progress</span>
          <span>{getFocusPercentage()}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${getFocusPercentage()}%` }}></div>
        </div>
      </div>

      <div className="streak-info">
        <div className="streak">
          <span className="streak-label">Current Streak:</span>
          <span className="streak-value">{formatTime(currentStreak)}</span>
        </div>
        <div className="streak">
          <span className="streak-label">Best Streak:</span>
          <span className="streak-value">{formatTime(bestStreak)}</span>
        </div>
      </div>

      <div className="focus-tips">
        <h4>Quick Tips:</h4>
        <ul>
          <li>Maintain good posture</li>
          <li>Keep your eyes on the screen</li>
          <li>Minimize background noise</li>
          <li>Take breaks when needed</li>
        </ul>
      </div>
    </div>
  )
}

export default FocusFeedback
