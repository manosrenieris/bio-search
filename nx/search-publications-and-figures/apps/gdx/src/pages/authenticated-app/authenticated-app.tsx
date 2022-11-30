import {Fragment} from 'react'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import Search from '../search/search'

interface User {
  username: string
  token: string
}

/* eslint-disable-next-line */
export interface AuthenticatedAppProps {
  user: User
  logout: () => void
}

export function AuthenticatedApp({user, logout}: AuthenticatedAppProps) {
  return (
    <Router basename={process.env.NX_BASE_PATH}>
      <Fragment>
        <Routes>
          <Route path="/" element={<Search logout={logout} />}></Route>
        </Routes>
      </Fragment>
    </Router>
  )
}

export default AuthenticatedApp
