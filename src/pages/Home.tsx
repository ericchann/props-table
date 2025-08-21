import { Link } from 'react-router-dom'
import { SUPPORTED_SPORTS, SPORT_META } from '../sports'

export default function Home() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Props table</h1>
      <p>Select a sport:</p>
      <ul>
        {SUPPORTED_SPORTS.map(s => (
          <li key={s}><Link to={`/${s}`}>{SPORT_META[s].label}</Link></li>
        ))}
      </ul>
    </div>
  )
}
