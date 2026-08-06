import { Link } from 'react-router-dom'
import { IconBack } from '../components/icons.jsx'
import ReadingTracker from '../components/ReadingTracker.jsx'

export default function SystemDesign() {
  return (
    <div className="rk-page">
      <div className="pagehead reveal">
        <Link to="/" className="back" aria-label="Back to home"><IconBack /></Link>
        <div className="htx"><div className="eye">Reading · 70 days</div><h1>System Design</h1></div>
      </div>
      <ReadingTracker planId="system-design" />
    </div>
  )
}
