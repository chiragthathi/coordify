import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageVisit } from './tracker'

export const useRouteAnalytics = () => {
  const location = useLocation()

  useEffect(() => {
    const fullPath = `${location.pathname}${location.search}`
    trackPageVisit(fullPath)
  }, [location.pathname, location.search])
}
