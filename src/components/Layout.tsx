import { AnimatePresence } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'

export function Layout() {
  const location = useLocation()

  return (
    <div className="app-shell no-nav">
      <AnimatePresence mode="wait">
        <Outlet key={location.pathname} />
      </AnimatePresence>
    </div>
  )
}
