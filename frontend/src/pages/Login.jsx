// import React, { useState, useEffect } from 'react'
// import { useNavigate, useLocation } from 'react-router-dom'
// import { login as apiLogin } from '../api/auth'
// import { useAuth } from '../hooks/useAuth'

// function Login() {
//   const [teamName, setTeamName] = useState('')
//   const [password, setPassword] = useState('')
//   const [error, setError] = useState('')
//   const navigate = useNavigate()
//   const location = useLocation()
//   const { login, isAuthenticated } = useAuth()

//   useEffect(() => {
//     if (isAuthenticated) {
//       const from = location.state?.from?.pathname || '/challenges'
//       navigate(from, { replace: true })
//     }
//   }, [isAuthenticated, navigate, location])

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setError('')
    
//     try {
//       const response = await apiLogin(teamName, password)
//       login(response)
//     } catch (err) {
//       console.error('Login error:', err)
//       setError('Invalid team credentials')
//     }
//   }

//   return (
//     <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
//       <h2 className="text-2xl font-bold mb-6">Team Login</h2>
//       {error && (
//         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
//           {error}
//         </div>
//       )}
//       <form onSubmit={handleSubmit}>
//         <div className="mb-4">
//           <label className="block mb-2">Team Name</label>
//           <input
//             type="text"
//             value={teamName}
//             onChange={(e) => setTeamName(e.target.value)}
//             className="w-full p-2 border rounded"
//             required
//           />
//         </div>
//         <div className="mb-6">
//           <label className="block mb-2">Password</label>
//           <input
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             className="w-full p-2 border rounded"
//             required
//           />
//         </div>
//         <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
//           Login
//         </button>
//       </form>
//     </div>
//   )
// }

// export default Login

import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { login as apiLogin } from "../api/auth"
import { useAuth } from "../hooks/useAuth"

function Login() {
  const [teamName, setTeamName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/challenges"
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    try {
      const response = await apiLogin(teamName, password)
      login(response)
    } catch (err) {
      console.error("Login error:", err)
      setError("Invalid team credentials")
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6 text-center">Team Login</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Login Information */}
          <div className="flex-1 space-y-4 p-4 border border-gray-300 rounded-md">
            <h3 className="text-xl font-semibold mb-4 text-black">Login Information</h3>
            <div>
              <label htmlFor="teamName" className="block mb-1 font-medium">
                Team Name *
              </label>
              <input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block mb-1 font-medium">
                Password *
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Additional Information or Instructions */}
          <div className="flex-1 space-y-4 p-4 border border-gray-300 rounded-md">
            <h3 className="text-xl font-semibold mb-4 text-black">Login Instructions</h3>
            <p className="text-gray-600">Please enter your team name and password to access the challenges.</p>
            <p className="text-gray-600">
              If you haven't registered your team yet, please go to the registration page.
            </p>
            <p className="text-gray-600">For any issues with logging in, please contact the event organizers.</p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Login
        </button>
      </form>
    </div>
  )
}

export default Login

