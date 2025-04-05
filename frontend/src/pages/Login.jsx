import React, { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { login } from "../api/auth"
import { useAuth } from "../hooks/useAuth"

function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login: authLogin } = useAuth()
  
  // Get the intended destination after login
  const from = location.state?.from?.pathname || "/challenges"

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      console.log("Logging in user...")
      const data = await login(formData.username, formData.password)
      
      console.log("Login successful:", data)
      
      // Store tokens in auth context
      authLogin({
        refresh: data.refresh,
        access: data.access
      })
      
      // Redirect based on team status
      if (data.user.has_team) {
        navigate(from)
      } else {
        navigate("/team-setup")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError(err.response?.data?.error || "Invalid credentials. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
      <div className="w-full max-w-md p-8 bg-[#FFF7ED] rounded-lg shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-900">Login to Your Account</h2>
        
        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block mb-1 font-medium text-gray-900">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block mb-1 font-medium text-gray-900">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
          
          <div className="mt-4 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-500 hover:text-blue-700">
                Register
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
