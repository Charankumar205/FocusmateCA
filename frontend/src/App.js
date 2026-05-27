"use client"

import { useState, useEffect } from "react"
import { login, register, getCurrentUser } from "./api"
import SessionStarter from "./components/SessionStarter"
import WebcamMonitor from "./components/WebcamMonitor"
import FocusFeedback from "./components/FocusFeedback"
import RefocusTips from "./components/RefocusTips"
import AnalyticsPanel from "./components/AnalyticsPanel"

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentSession, setCurrentSession] = useState(null)
  const [focusState, setFocusState] = useState("present") // 'present', 'distracted'
  const [showRefocusTips, setShowRefocusTips] = useState(false)
  const [authMode, setAuthMode] = useState("login") // 'login' or 'register'

  // Check for existing auth on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          const userData = await getCurrentUser()
          setUser(userData.user)
        } catch (error) {
          console.error("Auth check failed:", error)
          localStorage.removeItem("token")
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  // Handle focus state changes
  useEffect(() => {
    if (focusState === "distracted") {
      setShowRefocusTips(true)
    } else {
      setShowRefocusTips(false)
    }
  }, [focusState])

  const handleAuth = async (formData) => {
    try {
      let response
      if (authMode === "login") {
        response = await login(formData.email, formData.password)
      } else {
        response = await register(formData.username, formData.email, formData.password)
      }

      localStorage.setItem("token", response.token)
      setUser(response.user)
    } catch (error) {
      alert(error.message || "Authentication failed")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    setUser(null)
    setCurrentSession(null)
    setFocusState("present")
  }

  const handleSessionStart = (session) => {
    setCurrentSession(session)
    setFocusState("present")
  }

  const handleSessionEnd = () => {
    setCurrentSession(null)
    setFocusState("present")
  }

  const handleFocusChange = (newState) => {
    setFocusState(newState)
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app">
        <div className="auth-container">
          <div className="auth-card">
            <h1>Focus Monitor</h1>
            <p className="auth-subtitle">AI-powered focus tracking</p>

            <div className="auth-tabs">
              <button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>
                Login
              </button>
              <button className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>
                Register
              </button>
            </div>

            <AuthForm mode={authMode} onSubmit={handleAuth} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Focus Monitor</h1>
          <div className="user-info">
            <span>Welcome, {user.username}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="main-content">
          <div className="session-controls">
            <SessionStarter
              currentSession={currentSession}
              onSessionStart={handleSessionStart}
              onSessionEnd={handleSessionEnd}
            />
          </div>

          {currentSession && (
            <div className="monitoring-section">
              <div className="monitor-grid">
                <div className="webcam-section">
                  <WebcamMonitor
                    sessionId={currentSession.id}
                    onFocusChange={handleFocusChange}
                    isActive={!!currentSession}
                  />
                </div>

                <div className="feedback-section">
                  <FocusFeedback focusState={focusState} sessionId={currentSession.id} />
                </div>
              </div>

              {showRefocusTips && <RefocusTips onRefocused={() => handleFocusChange("present")} />}
            </div>
          )}

          <AnalyticsPanel userId={user.id} />
        </div>
      </main>
    </div>
  )
}

// Auth Form Component
function AuthForm({ mode, onSubmit }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {mode === "register" && (
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Enter your username"
          />
        </div>
      )}

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="Enter your email"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          placeholder="Enter your password"
          minLength="6"
        />
      </div>

      <button type="submit" className="auth-submit">
        {mode === "login" ? "Login" : "Register"}
      </button>
    </form>
  )
}

export default App
