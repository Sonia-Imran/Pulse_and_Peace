import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
})

API.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('user-token')   ||
    localStorage.getItem('doctor-token') ||
    localStorage.getItem('admin-token')
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