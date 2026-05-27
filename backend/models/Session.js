const mongoose = require("mongoose")

const eventSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ["present", "distracted", "refocused"],
    required: true,
  },
  meta: {
    confidence: Number,
    duration: Number,
    notes: String,
  },
})

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    events: [eventSchema],
    summary: {
      totalPresent: { type: Number, default: 0 },
      totalDistracted: { type: Number, default: 0 },
      focusScore: { type: Number, default: 0 },
      distractionCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  },
)

// Calculate session summary before saving
sessionSchema.pre("save", function (next) {
  if (this.events && this.events.length > 0) {
    let presentTime = 0
    let distractedTime = 0
    let distractionCount = 0

    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i]
      if (event.type === "distracted") {
        distractionCount++
      }

      // Calculate time between events (simplified)
      if (i > 0) {
        const timeDiff = (event.timestamp - this.events[i - 1].timestamp) / 1000
        if (this.events[i - 1].type === "present") {
          presentTime += timeDiff
        } else if (this.events[i - 1].type === "distracted") {
          distractedTime += timeDiff
        }
      }
    }

    this.summary.totalPresent = presentTime
    this.summary.totalDistracted = distractedTime
    this.summary.distractionCount = distractionCount

    const totalTime = presentTime + distractedTime
    this.summary.focusScore = totalTime > 0 ? Math.round((presentTime / totalTime) * 100) : 0
  }

  next()
})

module.exports = mongoose.model("Session", sessionSchema)
