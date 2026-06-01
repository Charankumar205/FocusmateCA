// API wrapper functions for backend communication

const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://focusmate-backend-0bz3.onrender.com/api"
    : "/api"
// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token")
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "API request failed")
  }

  return data
}

// Auth API functions
export const register = async (username, email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ username, email, password }),
  })

  return handleResponse(response)
}

export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ email, password }),
  })

  return handleResponse(response)
}

export const getCurrentUser = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  return handleResponse(response)
}

// Session API functions
export const startSession = async () => {
  const response = await fetch(`${API_BASE_URL}/sessions/start`, {
    method: "POST",
    headers: getAuthHeaders(),
  })

  return handleResponse(response)
}

export const postEvent = async (sessionId, type, meta = {}) => {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/event`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ type, meta }),
  })

  return handleResponse(response)
}

export const endSession = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/end`, {
    method: "POST",
    headers: getAuthHeaders(),
  })

  return handleResponse(response)
}

export const getSession = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  return handleResponse(response)
}

export const getSessions = async () => {
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  return handleResponse(response)
}
