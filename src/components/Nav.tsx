import { Link } from 'react-router-dom'
import { SUPPORTED_SPORTS, SPORT_META } from '../sports'

export default function Nav() {
  return (
    <nav style={{ padding: '12px 24px', borderBottom: '1px solid #eee' }}>
      {SUPPORTED_SPORTS.map(s => (
        <Link key={s} to={`/${s}`} style={{ marginRight: 16 }}>{SPORT_META[s].label}</Link>
      ))}
    </nav>
  )
}
