import { AnimatePresence } from 'framer-motion'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV: Array<{ to: string; label: string; icon: string; end?: boolean }> = [
  { to: '/', label: '首页', icon: '🏠', end: true },
  { to: '/summary', label: '就医总结', icon: '📊' },
  { to: '/settings', label: '设置', icon: '⚙️' },
]

export function Layout() {
  const { profile } = useAuth()
  const location = useLocation()
  const hideNav = !profile || location.pathname === '/onboarding'

  return (
    <div className={`app-shell ${hideNav ? 'no-nav' : ''}`}>
      <AnimatePresence mode="wait">
        <Outlet key={location.pathname} />
      </AnimatePresence>
      {!hideNav ? (
        <nav className="bottom-nav no-print" aria-label="主导航">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon" aria-hidden>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      ) : null}
    </div>
  )
}
