import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { register } from "../api/auth"
import { useAuth } from "../hooks/useAuth"

function Registration() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      console.log("Registering user...")
      const data = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      })
      
      console.log("Registration successful:", data)
      
      // Log the user in with the returned tokens
      login({
        refresh: data.refresh,
        access: data.access
      })
      
      // Redirect to team setup page
      navigate("/team-setup")
    } catch (err) {
      console.error("Registration error:", err)
      setError(err.response?.data?.error || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
      <div className="w-full max-w-md p-8 bg-[#FFF7ED] rounded-lg shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-900">Create Your Account</h2>
        
        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block mb-1 font-medium text-gray-900">
              Username *
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
            <label htmlFor="email" className="block mb-1 font-medium text-gray-900">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block mb-1 font-medium text-gray-900">
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? "Registering..." : "Register"}
          </button>
          
          <div className="mt-4 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-500 hover:text-blue-700">
                Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Registration
