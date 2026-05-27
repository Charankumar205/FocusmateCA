const express = require("express")
const Session = require("../models/Session")
const auth = require("../middleware/auth")

const router = express.Router()

// @route   POST /api/sessions/start
// @desc    Start a new focus session
// @access  Private
router.post("/start", auth, async (req, res) => {
  try {
    const session = new Session({
      userId: req.user._id,
      events: [
        {
          type: "present",
          timestamp: new Date(),
          meta: { notes: "Session started" },
        },
      ],
    })

    await session.save()

    res.status(201).json({
      message: "Session started successfully",
      session: {
        id: session._id,
        startedAt: session.startedAt,
        userId: session.userId,
      },
    })
  } catch (error) {
    console.error("Start session error:", error)
    res.status(500).json({ message: "Error starting session" })
  }
})

// @route   POST /api/sessions/:id/event
// @desc    Add an event to a session
// @access  Private
router.post("/:id/event", auth, async (req, res) => {
  try {
    const { type, meta } = req.body

    if (!["present", "distracted", "refocused"].includes(type)) {
      return res.status(400).json({ message: "Invalid event type" })
    }

    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id,
      endedAt: null, // Only allow events on active sessions
    })

    if (!session) {
      return res.status(404).json({ message: "Active session not found" })
    }

    session.events.push({
      type,
      timestamp: new Date(),
      meta: meta || {},
    })

    await session.save()

    res.json({
      message: "Event added successfully",
      event: session.events[session.events.length - 1],
    })
  } catch (error) {
    console.error("Add event error:", error)
    res.status(500).json({ message: "Error adding event" })
  }
})

// @route   POST /api/sessions/:id/end
// @desc    End a focus session
// @access  Private
router.post("/:id/end", auth, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id,
      endedAt: null,
    })

    if (!session) {
      return res.status(404).json({ message: "Active session not found" })
    }

    session.endedAt = new Date()
    session.duration = Math.floor((session.endedAt - session.startedAt) / 1000)

    // Add final event
    session.events.push({
      type: "present",
      timestamp: session.endedAt,
      meta: { notes: "Session ended" },
    })

    await session.save()

    res.json({
      message: "Session ended successfully",
      session: {
        id: session._id,
        duration: session.duration,
        summary: session.summary,
        endedAt: session.endedAt,
      },
    })
  } catch (error) {
    console.error("End session error:", error)
    res.status(500).json({ message: "Error ending session" })
  }
})

// @route   GET /api/sessions/:id
// @desc    Get session details and summary
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })

    if (!session) {
      return res.status(404).json({ message: "Session not found" })
    }

    res.json({
      session: {
        id: session._id,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        duration: session.duration,
        events: session.events,
        summary: session.summary,
      },
    })
  } catch (error) {
    console.error("Get session error:", error)
    res.status(500).json({ message: "Error fetching session" })
  }
})

// @route   GET /api/sessions
// @desc    Get user's session history
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id })
      .sort({ startedAt: -1 })
      .limit(10)
      .select("startedAt endedAt duration summary")

    res.json({ sessions })
  } catch (error) {
    console.error("Get sessions error:", error)
    res.status(500).json({ message: "Error fetching sessions" })
  }
})

module.exports = router
