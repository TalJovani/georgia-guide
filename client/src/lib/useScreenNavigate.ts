import { useLocation, useNavigate, type NavigateOptions } from 'react-router'
import { changeScreen, directionBetween } from './screenTransition'

// navigate(), with the same animated screen change a link click gets (components/ScreenTransitions).
// For screens that move on by themselves: after signing in, after sending a request.
export function useScreenNavigate() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (to: string, options?: NavigateOptions) =>
    changeScreen(() => navigate(to, options), directionBetween(pathname, to))
}
