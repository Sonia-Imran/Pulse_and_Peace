import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
})

API.interceptors.request.use((config) => {
  // Pick the token based on which portal is currently active (URL path),
  // instead of blindly cascading. This prevents a leftover patient/doctor
  // token from being sent on a different portal's requests when multiple
  // roles have been logged into on the same browser.
  const path = window.location.pathname
  let token

  if (path.startsWith('/doctor')) {
    token = localStorage.getItem('doctor-token')
  } else if (path.startsWith('/dashboard') || path.startsWith('/admin')) {
    token = localStorage.getItem('admin-token')
  } else {
    token = localStorage.getItem('user-token')
  }

  // Fallback: if the expected token for this portal isn't present,
  // fall back to whichever token does exist (covers edge cases like
  // shared/public routes called before navigation finishes).
  if (!token) {
    token =
      localStorage.getItem('user-token') ||
      localStorage.getItem('doctor-token') ||
      localStorage.getItem('admin-token')
  }

  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

API.interceptors.response.use(
  res => res,
  err => {
    console.error('API Error:', err.response?.data)
    return Promise.reject(err)
  }
)

export default API