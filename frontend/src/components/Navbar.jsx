import { NavLink, useNavigate } from 'react-router-dom'
import { Dumbbell, TrendingUp, Trophy, ListChecks, LogOut } from 'lucide-react'

export default function Navbar({ username = 'local' }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-brand-icon">
          <Dumbbell size={16} color="white" />
        </div>
        Tracker
      </div>

      <div className="navbar-nav">
        <NavLink to="/workouts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Dumbbell size={20} />
          Workouts
        </NavLink>
        <NavLink to="/progress" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <TrendingUp size={20} />
          Progress
        </NavLink>
        <NavLink to="/prs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Trophy size={20} />
          PRs
        </NavLink>
        <NavLink to="/exercises" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <ListChecks size={20} />
          Exercises
        </NavLink>
      </div>

      <div className="navbar-right">
        <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>{username}</span>
        <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </nav>
  )
}
