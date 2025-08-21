import axios, { type AxiosRequestHeaders, type InternalAxiosRequestConfig } from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '',
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
