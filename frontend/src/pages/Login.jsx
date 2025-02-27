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
      <div className="bg-[#FFF7ED] p-8 rounded-lg shadow-sm">
        <h2 className="text-3xl font-bold mb-6 text-center text-red-500">Team Login</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Login Information */}
            <div className="flex-1 space-y-4 p-4 border border-gray-300 rounded-md bg-white">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Login Information</h3>
              <div>
                <label htmlFor="teamName" className="block mb-1 font-medium text-gray-900">
                  Team Name *
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block mb-1 font-medium text-gray-900">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>
            </div>

            {/* Additional Information or Instructions */}
            <div className="flex-1 space-y-4 p-4 border border-gray-300 rounded-md bg-white">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Login Instructions</h3>
              <p className="text-gray-700">Please enter your team name and password to access the challenges.</p>
              <p className="text-gray-700">
                If you haven't registered your team yet, please go to the registration page.
              </p>
              <p className="text-gray-700">For any issues with logging in, please contact the event organizers.</p>
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
    </div>
  )
}

export default Login
