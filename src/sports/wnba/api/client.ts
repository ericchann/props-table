import axios, { type AxiosRequestHeaders, type InternalAxiosRequestConfig } from 'axios'

// Normalize the configured base so it doesn't accidentally include a sport segment
// e.g. VITE_API_BASE='https://api.props.cash/WNBA' -> strip trailing '/wnba'
function normalizeBase(raw = ''): string {
  try {
    // remove trailing sport segments like /wnba, /WNBA, /csgo, etc.
    return raw.replace(/\/+(wnba|nba|mlb|csgo)\/?$/i, '')
  } catch (err) {
    return raw
  }
}

const rawBase = import.meta.env.VITE_API_BASE ?? ''
const baseURL = normalizeBase(String(rawBase))

export const api = axios.create({
  baseURL,
  timeout: 15000
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = import.meta.env.VITE_API_TOKEN
  if (token) {
    const headers = (config.headers ?? {}) as Record<string, string | number | boolean>
    headers.Authorization = `Bearer ${token}`
    config.headers = headers as AxiosRequestHeaders
  }
  return config
})
