"use client"

import { useState, useEffect } from "react"
import { postEvent } from "../api"

const RefocusTips = ({ onRefocused }) => {
  const [currentTip, setCurrentTip] = useState(0)
  const [showBreathingExercise, setShowBreathingExercise] = useState(false)
  const [breathingPhase, setBreathingPhase] = useState("inhale") // 'inhale', 'hold', 'exhale'
  const [breathingCount, setBreathingCount] = useState(0)

  const refocusTips = [
    {
      title: "Take a Deep Breath",
      description: "Close your eyes and take 3 deep breaths to reset your focus.",
      action: "Start Breathing Exercise",
      actionType: "breathing",
    },
    {
      title: "Adjust Your Posture",
      description: "Sit up straight, align your shoulders, and position your screen at eye level.",
      action: "I've Adjusted My Posture",
      actionType: "posture",
    },
    {
      title: "Eliminate Distractions",
      description: "Close unnecessary tabs, silence notifications, and clear your workspace.",
      action: "Distractions Cleared",
      actionType: "environment",
    },
    {
      title: "Hydrate & Refresh",
      description: "Take a sip of water and splash some cool water on your face if needed.",
      action: "I'm Refreshed",
      actionType: "refresh",
    },
    {
      title: "Set a Mini Goal",
      description: "Focus on completing just the next 10 minutes of work without distraction.",
      action: "Goal Set",
      actionType: "goal",
    },
    {
      title: "Quick Stretch",
      description: "Do a 30-second neck and shoulder stretch to re-energize.",
      action: "I've Stretched",
      actionType: "stretch",
    },
  ]

  // Breathing exercise logic
  useEffect(() => {
    if (!showBreathingExercise) return

    const breathingCycle = () => {
      const phases = [
        { phase: "inhale", duration: 4000, next: "hold" },
        { phase: "hold", duration: 4000, next: "exhale" },
        { phase: "exhale", duration: 6000, next: "inhale" },
      ]

      const currentPhaseData = phases.find((p) => p.phase === breathingPhase)

      const timer = setTimeout(() => {
        setBreathingPhase(currentPhaseData.next)
        if (currentPhaseData.next === "inhale") {
          setBreathingCount((prev) => prev + 1)
        }
      }, currentPhaseData.duration)

      return () => clearTimeout(timer)
    }

    const cleanup = breathingCycle()
    return cleanup
  }, [breathingPhase, showBreathingExercise])

  // Auto-complete breathing exercise after 3 cycles
  useEffect(() => {
    if (breathingCount >= 3 && showBreathingExercise) {
      setShowBreathingExercise(false)
      setBreathingCount(0)
      setBreathingPhase("inhale")
      handleRefocused("breathing")
    }
  }, [breathingCount, showBreathingExercise])

  const handleTipAction = (actionType) => {
    if (actionType === "breathing") {
      setShowBreathingExercise(true)
      setBreathingCount(0)
      setBreathingPhase("inhale")
    } else {
      handleRefocused(actionType)
    }
  }

  const handleRefocused = async (method) => {
    try {
      // You could send this data to track which refocus methods work best
      await postEvent(sessionStorage.getItem("currentSessionId"), "refocused", {
        method,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Failed to log refocus event:", error)
    }

    onRefocused()
  }

  const nextTip = () => {
    setCurrentTip((prev) => (prev + 1) % refocusTips.length)
  }

  const prevTip = () => {
    setCurrentTip((prev) => (prev - 1 + refocusTips.length) % refocusTips.length)
  }

  if (showBreathingExercise) {
    return (
      <div className="refocus-tips breathing-exercise">
        <div className="breathing-container">
          <h3>Breathing Exercise</h3>
          <div className="breathing-visual">
            <div className={`breathing-circle ${breathingPhase}`}>
              <div className="breathing-text">
                {breathingPhase === "inhale" && "Breathe In"}
                {breathingPhase === "hold" && "Hold"}
                {breathingPhase === "exhale" && "Breathe Out"}
              </div>
            </div>
          </div>
          <div className="breathing-counter">
            <p>Cycle {breathingCount + 1} of 3</p>
            <p className="breathing-instruction">
              {breathingPhase === "inhale" && "Slowly breathe in through your nose..."}
              {breathingPhase === "hold" && "Hold your breath gently..."}
              {breathingPhase === "exhale" && "Slowly exhale through your mouth..."}
            </p>
          </div>
          <button
            onClick={() => {
              setShowBreathingExercise(false)
              setBreathingCount(0)
              handleRefocused("breathing")
            }}
            className="btn btn-secondary"
          >
            Skip Exercise
          </button>
        </div>
      </div>
    )
  }

  const tip = refocusTips[currentTip]

  return (
    <div className="refocus-tips">
      <div className="tips-header">
        <h3>🎯 Time to Refocus!</h3>
        <p>Try one of these techniques to get back on track:</p>
      </div>

      <div className="tip-card">
        <div className="tip-navigation">
          <button onClick={prevTip} className="nav-btn">
            ‹
          </button>
          <span className="tip-counter">
            {currentTip + 1} of {refocusTips.length}
          </span>
          <button onClick={nextTip} className="nav-btn">
            ›
          </button>
        </div>

        <div className="tip-content">
          <h4>{tip.title}</h4>
          <p>{tip.description}</p>
        </div>

        <div className="tip-actions">
          <button onClick={() => handleTipAction(tip.actionType)} className="btn btn-primary">
            {tip.action}
          </button>
          <button onClick={nextTip} className="btn btn-secondary">
            Try Another Tip
          </button>
        </div>
      </div>

      <div className="quick-actions">
        <h4>Quick Actions:</h4>
        <div className="action-buttons">
          <button onClick={() => handleRefocused("manual")} className="btn btn-success btn-sm">
            ✅ I'm Focused Now
          </button>
          <button onClick={() => handleTipAction("breathing")} className="btn btn-info btn-sm">
            🫁 Breathing Exercise
          </button>
          <button onClick={() => handleRefocused("break")} className="btn btn-warning btn-sm">
            ⏸️ Take a Short Break
          </button>
        </div>
      </div>

      <div className="motivation">
        <p>
          💪 <strong>You've got this!</strong> Small refocus breaks lead to better overall productivity.
        </p>
      </div>
    </div>
  )
}

export default RefocusTips
