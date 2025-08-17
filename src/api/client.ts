import axios from 'axios'
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE, // e.g., https://api.props.cash/WNBA
  timeout: 15000
})
