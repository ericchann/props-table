import { useParams, Navigate } from 'react-router-dom'
import App from '../App'
import { isSupportedSport } from '../sports'

export default function SportPage() {
  const { sport } = useParams()
  if (!isSupportedSport(sport ?? null)) {
    return <Navigate to="/" replace />
  }
  return <App sport={sport as any} />
}
