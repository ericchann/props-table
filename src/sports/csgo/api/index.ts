import { api } from '../../wnba/api/client'

export async function getLines() {
  const res = await api.get('/csgo/lines')
  return Array.isArray(res.data) ? res.data : []
}

export async function getTrends() {
  // trends endpoint is lowercase on the API
  const res = await api.get('/csgo/prop-trends')
  return Array.isArray(res.data) ? res.data : []
}

export async function getSchedule() {
  const res = await api.get('/csgo/schedule')
  return Array.isArray(res.data) ? res.data : []
}
