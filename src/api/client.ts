import axios, { type AxiosRequestHeaders, type InternalAxiosRequestConfig } from 'axios'

export const api = axios.create({
  // fallback to empty string so requests become absolute-relative paths (inspect network)
  baseURL: import.meta.env.VITE_API_BASE ?? '',
  timeout: 15000
})

// Attach the token if provided
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = import.meta.env.VITE_API_TOKEN
  if (token) {
    // ensure a plain object we can safely mutate/assign
    const headers = (config.headers ?? {}) as Record<string, string | number | boolean>
    headers.Authorization = `Bearer ${token}`
    config.headers = headers as AxiosRequestHeaders
  }
  return config
})