"use client"

import { useState, useEffect } from "react"
import { getSessions } from "../api"

const AnalyticsPanel = ({ userId }) => {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("week") // 'week', 'month', 'all'
  const [selectedChart, setSelectedChart] = useState("line") // 'line', 'bar', 'histogram', 'heatmap'
  const [analytics, setAnalytics] = useState({
    totalSessions: 0,
    totalFocusTime: 0,
    averageFocusScore: 0,
    totalDistractions: 0,
    longestSession: 0,
    bestFocusScore: 0,
  })

  // Fetch sessions data
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true)
        const response = await getSessions()
        setSessions(response.sessions || [])
      } catch (error) {
        console.error("Failed to fetch sessions:", error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchSessions()
    }
  }, [userId])

  // Calculate analytics when sessions change
  useEffect(() => {
    if (sessions.length === 0) {
      setAnalytics({
        totalSessions: 0,
        totalFocusTime: 0,
        averageFocusScore: 0,
        totalDistractions: 0,
        longestSession: 0,
        bestFocusScore: 0,
      })
      return
    }

    const filteredSessions = filterSessionsByPeriod(sessions, selectedPeriod)

    const stats = filteredSessions.reduce(
      (acc, session) => {
        acc.totalSessions += 1
        acc.totalFocusTime += session.summary?.totalPresent || 0
        acc.totalDistractions += session.summary?.distractionCount || 0
        acc.longestSession = Math.max(acc.longestSession, session.duration || 0)
        acc.bestFocusScore = Math.max(acc.bestFocusScore, session.summary?.focusScore || 0)
        acc.totalFocusScore += session.summary?.focusScore || 0

        return acc
      },
      {
        totalSessions: 0,
        totalFocusTime: 0,
        totalDistractions: 0,
        longestSession: 0,
        bestFocusScore: 0,
        totalFocusScore: 0,
      },
    )

    setAnalytics({
      ...stats,
      averageFocusScore: stats.totalSessions > 0 ? Math.round(stats.totalFocusScore / stats.totalSessions) : 0,
    })
  }, [sessions, selectedPeriod])

  const filterSessionsByPeriod = (sessions, period) => {
    const now = new Date()
    const cutoffDate = new Date()

    switch (period) {
      case "week":
        cutoffDate.setDate(now.getDate() - 7)
        break
      case "month":
        cutoffDate.setMonth(now.getMonth() - 1)
        break
      case "all":
      default:
        return sessions
    }

    return sessions.filter((session) => new Date(session.startedAt) >= cutoffDate)
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getScoreColor = (score) => {
    if (score >= 90) return "excellent"
    if (score >= 75) return "good"
    if (score >= 50) return "okay"
    return "needs-improvement"
  }

  const getScoreColorHex = (score) => {
    if (score >= 90) return "#06ffa5"
    if (score >= 75) return "#00d4ff"
    if (score >= 50) return "#fb8500"
    return "#ff006e"
  }

  const getProgressData = () => {
    const filteredSessions = filterSessionsByPeriod(sessions, selectedPeriod)
    return filteredSessions
      .slice(-14)
      .reverse()
      .map((session, index) => ({
        date: new Date(session.startedAt).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        score: session.summary?.focusScore || 0,
        duration: (session.duration || 0) / 60, // Convert to minutes
        distractions: session.summary?.distractionCount || 0,
        focusTime: (session.summary?.totalPresent || 0) / 60, // Convert to minutes
        index: index,
      }))
  }

  const getHistogramData = () => {
    const filteredSessions = filterSessionsByPeriod(sessions, selectedPeriod)
    const scoreRanges = [
      { range: "0-20", min: 0, max: 20, count: 0, color: "#ff006e" },
      { range: "21-40", min: 21, max: 40, count: 0, color: "#ff4081" },
      { range: "41-60", min: 41, max: 60, count: 0, color: "#fb8500" },
      { range: "61-80", min: 61, max: 80, count: 0, color: "#00d4ff" },
      { range: "81-100", min: 81, max: 100, count: 0, color: "#06ffa5" },
    ]

    filteredSessions.forEach((session) => {
      const score = session.summary?.focusScore || 0
      scoreRanges.forEach((range) => {
        if (score >= range.min && score <= range.max) {
          range.count++
        }
      })
    })

    return scoreRanges
  }

  const getHeatmapData = () => {
    const filteredSessions = filterSessionsByPeriod(sessions, selectedPeriod)
    const heatmapData = Array(7)
      .fill()
      .map(() => Array(24).fill(0))
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    filteredSessions.forEach((session) => {
      const date = new Date(session.startedAt)
      const dayOfWeek = date.getDay()
      const hour = date.getHours()
      const score = session.summary?.focusScore || 0

      heatmapData[dayOfWeek][hour] = Math.max(heatmapData[dayOfWeek][hour], score)
    })

    return { data: heatmapData, days }
  }

  // Chart Components
  const LineChart = ({ data }) => {
    const maxScore = Math.max(...data.map((d) => d.score), 100)
    const maxDuration = Math.max(...data.map((d) => d.duration), 60)

    return (
      <div style={{ position: "relative", height: "300px", padding: "20px" }}>
        <svg width="100%" height="100%" viewBox="0 0 800 250" style={{ overflow: "visible" }}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="50"
              y1={200 - y * 2}
              x2="750"
              y2={200 - y * 2}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          ))}

          {/* Y-axis labels */}
          {[0, 25, 50, 75, 100].map((y) => (
            <text key={y} x="40" y={205 - y * 2} fill="rgba(255, 255, 255, 0.7)" fontSize="12" textAnchor="end">
              {y}%
            </text>
          ))}

          {/* Score line */}
          <path
            d={`M ${data.map((d, i) => `${50 + i * (700 / (data.length - 1))},${200 - d.score * 2}`).join(" L ")}`}
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="3"
            style={{
              filter: "drop-shadow(0 0 8px rgba(0, 212, 255, 0.5))",
              animation: "drawLine 2s ease-in-out",
            }}
          />

          {/* Duration line */}
          <path
            d={`M ${data.map((d, i) => `${50 + i * (700 / (data.length - 1))},${200 - (d.duration / maxDuration) * 100 * 2}`).join(" L ")}`}
            fill="none"
            stroke="url(#durationGradient)"
            strokeWidth="2"
            strokeDasharray="5,5"
            style={{
              filter: "drop-shadow(0 0 6px rgba(6, 255, 165, 0.4))",
              animation: "drawLine 2s ease-in-out 0.5s both",
            }}
          />

          {/* Data points */}
          {data.map((d, i) => (
            <g key={i}>
              <circle
                cx={50 + i * (700 / (data.length - 1))}
                cy={200 - d.score * 2}
                r="6"
                fill={getScoreColorHex(d.score)}
                stroke="white"
                strokeWidth="2"
                style={{
                  filter: `drop-shadow(0 0 8px ${getScoreColorHex(d.score)})`,
                  animation: `pointAppear 0.5s ease-out ${i * 0.1}s both`,
                }}
              />
              <circle
                cx={50 + i * (700 / (data.length - 1))}
                cy={200 - (d.duration / maxDuration) * 100 * 2}
                r="4"
                fill="#06ffa5"
                stroke="white"
                strokeWidth="1"
                style={{
                  animation: `pointAppear 0.5s ease-out ${i * 0.1 + 0.5}s both`,
                }}
              />
            </g>
          ))}

          {/* X-axis labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={50 + i * (700 / (data.length - 1))}
              y="230"
              fill="rgba(255, 255, 255, 0.7)"
              fontSize="10"
              textAnchor="middle"
              transform={`rotate(-45, ${50 + i * (700 / (data.length - 1))}, 230)`}
            >
              {d.date}
            </text>
          ))}

          {/* Gradients */}
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="50%" stopColor="#8338ec" />
              <stop offset="100%" stopColor="#06ffa5" />
            </linearGradient>
            <linearGradient id="durationGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06ffa5" />
              <stop offset="100%" stopColor="#00d4ff" />
            </linearGradient>
          </defs>
        </svg>

        {/* Legend */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "20px",
            background: "rgba(26, 26, 46, 0.9)",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid rgba(0, 212, 255, 0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
            <div
              style={{
                width: "20px",
                height: "3px",
                background: "linear-gradient(90deg, #00d4ff, #06ffa5)",
                marginRight: "8px",
              }}
            ></div>
            <span style={{ color: "white", fontSize: "12px" }}>Focus Score</span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{ width: "20px", height: "2px", background: "#06ffa5", marginRight: "8px", borderStyle: "dashed" }}
            ></div>
            <span style={{ color: "white", fontSize: "12px" }}>Duration (min)</span>
          </div>
        </div>
      </div>
    )
  }

  const BarChart = ({ data }) => {
    const maxValue = Math.max(...data.map((d) => Math.max(d.score, d.duration)))

    return (
      <div style={{ position: "relative", height: "300px", padding: "20px" }}>
        <svg width="100%" height="100%" viewBox="0 0 800 250">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="50"
              y1={200 - y * 2}
              x2="750"
              y2={200 - y * 2}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          ))}

          {/* Bars */}
          {data.map((d, i) => {
            const barWidth = (700 / data.length) * 0.8
            const barSpacing = 700 / data.length
            const x = 50 + i * barSpacing + (barSpacing - barWidth) / 2

            return (
              <g key={i}>
                {/* Score bar */}
                <rect
                  x={x}
                  y={200 - d.score * 2}
                  width={barWidth * 0.4}
                  height={d.score * 2}
                  fill={`url(#barGradient${i})`}
                  rx="4"
                  style={{
                    filter: `drop-shadow(0 0 8px ${getScoreColorHex(d.score)})`,
                    animation: `barGrow 1s ease-out ${i * 0.1}s both`,
                  }}
                />

                {/* Duration bar */}
                <rect
                  x={x + barWidth * 0.5}
                  y={200 - (d.duration / 60) * 100 * 2}
                  width={barWidth * 0.4}
                  height={(d.duration / 60) * 100 * 2}
                  fill="url(#durationBarGradient)"
                  rx="4"
                  style={{
                    filter: "drop-shadow(0 0 6px rgba(6, 255, 165, 0.4))",
                    animation: `barGrow 1s ease-out ${i * 0.1 + 0.2}s both`,
                  }}
                />

                {/* X-axis labels */}
                <text
                  x={x + barWidth / 2}
                  y="230"
                  fill="rgba(255, 255, 255, 0.7)"
                  fontSize="10"
                  textAnchor="middle"
                  transform={`rotate(-45, ${x + barWidth / 2}, 230)`}
                >
                  {d.date}
                </text>
              </g>
            )
          })}

          {/* Y-axis labels */}
          {[0, 25, 50, 75, 100].map((y) => (
            <text key={y} x="40" y={205 - y * 2} fill="rgba(255, 255, 255, 0.7)" fontSize="12" textAnchor="end">
              {y}%
            </text>
          ))}

          <defs>
            {data.map((d, i) => (
              <linearGradient key={i} id={`barGradient${i}`} x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor={getScoreColorHex(d.score)} stopOpacity="0.8" />
                <stop offset="100%" stopColor={getScoreColorHex(d.score)} />
              </linearGradient>
            ))}
            <linearGradient id="durationBarGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#06ffa5" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#06ffa5" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    )
  }

  const Histogram = ({ data }) => {
    const maxCount = Math.max(...data.map((d) => d.count))

    return (
      <div style={{ position: "relative", height: "300px", padding: "20px" }}>
        <svg width="100%" height="100%" viewBox="0 0 600 250">
          {/* Grid lines */}
          {Array.from({ length: 6 }, (_, i) => i * (maxCount / 5)).map((y, i) => (
            <line
              key={i}
              x1="50"
              y1={200 - i * 40}
              x2="550"
              y2={200 - i * 40}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          ))}

          {/* Histogram bars */}
          {data.map((d, i) => {
            const barWidth = 80
            const barHeight = maxCount > 0 ? (d.count / maxCount) * 180 : 0
            const x = 70 + i * 100

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={200 - barHeight}
                  width={barWidth}
                  height={barHeight}
                  fill={d.color}
                  rx="8"
                  style={{
                    filter: `drop-shadow(0 0 10px ${d.color}44)`,
                    animation: `barGrow 1.5s ease-out ${i * 0.2}s both`,
                  }}
                />

                {/* Count labels */}
                <text
                  x={x + barWidth / 2}
                  y={195 - barHeight}
                  fill="white"
                  fontSize="14"
                  fontWeight="bold"
                  textAnchor="middle"
                  style={{ textShadow: "0 0 10px rgba(0, 0, 0, 0.8)" }}
                >
                  {d.count}
                </text>

                {/* Range labels */}
                <text
                  x={x + barWidth / 2}
                  y="220"
                  fill="rgba(255, 255, 255, 0.8)"
                  fontSize="12"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {d.range}%
                </text>
              </g>
            )
          })}

          {/* Y-axis labels */}
          {Array.from({ length: 6 }, (_, i) => Math.round(i * (maxCount / 5))).map((y, i) => (
            <text key={i} x="40" y={205 - i * 40} fill="rgba(255, 255, 255, 0.7)" fontSize="12" textAnchor="end">
              {y}
            </text>
          ))}
        </svg>

        <div
          style={{
            textAlign: "center",
            marginTop: "10px",
            color: "rgba(255, 255, 255, 0.8)",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          Focus Score Distribution
        </div>
      </div>
    )
  }

  const Heatmap = ({ data, days }) => {
    const maxScore = Math.max(...data.flat())

    return (
      <div style={{ position: "relative", height: "300px", padding: "20px" }}>
        <svg width="100%" height="100%" viewBox="0 0 800 250">
          {/* Day labels */}
          {days.map((day, i) => (
            <text
              key={i}
              x="30"
              y={35 + i * 30}
              fill="rgba(255, 255, 255, 0.8)"
              fontSize="12"
              textAnchor="end"
              fontWeight="600"
            >
              {day}
            </text>
          ))}

          {/* Hour labels */}
          {Array.from({ length: 24 }, (_, i) => i)
            .filter((h) => h % 4 === 0)
            .map((hour) => (
              <text
                key={hour}
                x={50 + hour * 25}
                y="20"
                fill="rgba(255, 255, 255, 0.8)"
                fontSize="10"
                textAnchor="middle"
              >
                {hour}:00
              </text>
            ))}

          {/* Heatmap cells */}
          {data.map((dayData, dayIndex) =>
            dayData.map((score, hourIndex) => {
              const intensity = maxScore > 0 ? score / maxScore : 0
              const color = score > 0 ? getScoreColorHex(score) : "rgba(255, 255, 255, 0.1)"

              return (
                <rect
                  key={`${dayIndex}-${hourIndex}`}
                  x={50 + hourIndex * 25}
                  y={25 + dayIndex * 30}
                  width="20"
                  height="25"
                  fill={color}
                  fillOpacity={intensity > 0 ? Math.max(intensity, 0.3) : 0.1}
                  rx="3"
                  style={{
                    filter: score > 0 ? `drop-shadow(0 0 4px ${color}44)` : "none",
                    animation: `cellAppear 0.3s ease-out ${(dayIndex * 24 + hourIndex) * 0.01}s both`,
                  }}
                >
                  <title>{`${days[dayIndex]} ${hourIndex}:00 - Score: ${score}%`}</title>
                </rect>
              )
            }),
          )}
        </svg>

        <div
          style={{
            textAlign: "center",
            marginTop: "10px",
            color: "rgba(255, 255, 255, 0.8)",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          Focus Activity Heatmap (by Hour & Day)
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="analytics-panel">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  const progressData = getProgressData()
  const histogramData = getHistogramData()
  const heatmapData = getHeatmapData()

  return (
    <div className="analytics-panel">
      <style jsx>{`
        @keyframes drawLine {
          0% { stroke-dasharray: 0 1000; }
          100% { stroke-dasharray: 1000 0; }
        }
        
        @keyframes pointAppear {
          0% { opacity: 0; transform: scale(0); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes barGrow {
          0% { transform: scaleY(0); transform-origin: bottom; }
          100% { transform: scaleY(1); transform-origin: bottom; }
        }
        
        @keyframes cellAppear {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="analytics-header">
        <h3>📊 Advanced Focus Analytics</h3>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <div className="period-selector">
            <button className={selectedPeriod === "week" ? "active" : ""} onClick={() => setSelectedPeriod("week")}>
              This Week
            </button>
            <button className={selectedPeriod === "month" ? "active" : ""} onClick={() => setSelectedPeriod("month")}>
              This Month
            </button>
            <button className={selectedPeriod === "all" ? "active" : ""} onClick={() => setSelectedPeriod("all")}>
              All Time
            </button>
          </div>

          <div
            className="chart-selector"
            style={{
              display: "flex",
              borderRadius: "12px",
              overflow: "hidden",
              background: "rgba(26, 26, 46, 0.8)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
            }}
          >
            {[
              { key: "line", label: "📈", title: "Line Chart" },
              { key: "bar", label: "📊", title: "Bar Chart" },
              { key: "histogram", label: "📋", title: "Histogram" },
              { key: "heatmap", label: "🔥", title: "Heatmap" },
            ].map((chart) => (
              <button
                key={chart.key}
                onClick={() => setSelectedChart(chart.key)}
                title={chart.title}
                style={{
                  padding: "0.75rem 1rem",
                  border: "none",
                  background: selectedChart === chart.key ? "linear-gradient(135deg, #00d4ff, #8338ec)" : "transparent",
                  color: selectedChart === chart.key ? "white" : "rgba(255, 255, 255, 0.7)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                }}
              >
                {chart.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="no-data">
          <p>No session data available yet.</p>
          <p>Start your first focus session to see analytics!</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{analytics.totalSessions}</div>
              <div className="stat-label">Total Sessions</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{formatTime(analytics.totalFocusTime)}</div>
              <div className="stat-label">Focus Time</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{analytics.averageFocusScore}%</div>
              <div className="stat-label">Avg Focus Score</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{analytics.totalDistractions}</div>
              <div className="stat-label">Total Distractions</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{formatTime(analytics.longestSession)}</div>
              <div className="stat-label">Longest Session</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{analytics.bestFocusScore}%</div>
              <div className="stat-label">Best Focus Score</div>
            </div>
          </div>

          <div className="progress-chart">
            <h4>
              {selectedChart === "line" && "📈 Progress Trends"}
              {selectedChart === "bar" && "📊 Session Comparison"}
              {selectedChart === "histogram" && "📋 Score Distribution"}
              {selectedChart === "heatmap" && "🔥 Activity Heatmap"}
            </h4>
            <div className="chart-container">
              {progressData.length > 0 ? (
                <>
                  {selectedChart === "line" && <LineChart data={progressData} />}
                  {selectedChart === "bar" && <BarChart data={progressData} />}
                  {selectedChart === "histogram" && <Histogram data={histogramData} />}
                  {selectedChart === "heatmap" && <Heatmap data={heatmapData.data} days={heatmapData.days} />}
                </>
              ) : (
                <p>Not enough data for charts</p>
              )}
            </div>
          </div>

          <div className="recent-sessions">
            <h4>Recent Sessions</h4>
            <div className="sessions-list">
              {sessions.slice(0, 5).map((session) => (
                <div key={session._id} className="session-item">
                  <div className="session-info">
                    <div className="session-date">{formatDate(session.startedAt)}</div>
                    <div className="session-duration">{formatTime(session.duration || 0)}</div>
                  </div>
                  <div className="session-stats">
                    <div className={`focus-score ${getScoreColor(session.summary?.focusScore || 0)}`}>
                      {session.summary?.focusScore || 0}%
                    </div>
                    <div className="distractions">{session.summary?.distractionCount || 0} distractions</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="insights">
            <h4>💡 AI-Powered Insights</h4>
            <div className="insight-cards">
              {analytics.averageFocusScore >= 80 && (
                <div className="insight-card positive">
                  <span className="insight-emoji">🎉</span>
                  <p>Excellent! Your focus consistency is outstanding.</p>
                </div>
              )}

              {analytics.totalDistractions > analytics.totalSessions * 3 && (
                <div className="insight-card warning">
                  <span className="insight-emoji">⚠️</span>
                  <p>High distraction rate detected. Consider optimizing your environment.</p>
                </div>
              )}

              {analytics.longestSession > 3600 && (
                <div className="insight-card positive">
                  <span className="insight-emoji">🏆</span>
                  <p>Amazing endurance! You've mastered long focus sessions.</p>
                </div>
              )}

              {analytics.totalSessions >= 10 && (
                <div className="insight-card positive">
                  <span className="insight-emoji">📈</span>
                  <p>Great habit formation! You're building consistent focus patterns.</p>
                </div>
              )}

              {analytics.averageFocusScore < 50 && analytics.totalSessions > 3 && (
                <div className="insight-card warning">
                  <span className="insight-emoji">💪</span>
                  <p>Room for improvement! Try shorter sessions and eliminate distractions.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AnalyticsPanel
