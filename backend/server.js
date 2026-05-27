const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const connectDB = require("./config/db")

// Load environment variables
dotenv.config()

// Connect to MongoDB
connectDB()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/sessions", require("./routes/sessions"))

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ message: "Focus Monitor API is running!" })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
