import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { register } from "../api/auth"
import { useAuth } from "../hooks/useAuth"
import { validateEmail } from "../utils/validators"

function Registration() {
  const [formData, setFormData] = useState({
    teamName: "",
    teamEmail: "",
    password: "",
    member1Name: "",
    member1Email: "",
    member2Name: "",
    member2Email: "",
    member3Name: "",
    member3Email: "",
  })
  const [error, setError] = useState("")
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

    // Calculate team size based on provided member emails
    const memberCount = [formData.member1Email, formData.member2Email, formData.member3Email].filter(Boolean).length

    try {
      // console.log(formData)
      const data = await register({
        ...formData,
        teamSize: memberCount, // Add team size to registration data
      })
      login(data)
      navigate("/")
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.")
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-[#FFF7ED] p-8 rounded-lg shadow-sm">
        <h2 className="text-3xl font-bold mb-6 text-center text-red-500">Team Registration</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Team Information */}
            <div className="flex-1 space-y-4 p-4 border border-gray-300 rounded-md bg-white">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Team Information</h3>
              <div>
                <label htmlFor="teamName" className="block mb-1 font-medium text-gray-900">
                  Team Name *
                </label>
                <input
                  type="text"
                  id="teamName"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  required
                />
              </div>
              <div>
                <label htmlFor="teamEmail" className="block mb-1 font-medium text-gray-900">
                  Team Email *
                </label>
                <input
                  type="email"
                  id="teamEmail"
                  name="teamEmail"
                  value={formData.teamEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block mb-1 font-medium text-gray-900">
                  Team Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {/* Team Members */}
            <div className="flex-1 space-y-4 p-4 border border-gray-300 rounded-md bg-white">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Team Members</h3>
              {/* Member 1 */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Member 1 (Required)</h4>
                <div>
                  <label htmlFor="member1Name" className="block mb-1 text-sm text-gray-900">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="member1Name"
                    name="member1Name"
                    value={formData.member1Name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="member1Email" className="block mb-1 text-sm text-gray-900">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="member1Email"
                    name="member1Email"
                    value={formData.member1Email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    required
                  />
                </div>
              </div>

              {/* Member 2 */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Member 2 (Optional)</h4>
                <div>
                  <label htmlFor="member2Name" className="block mb-1 text-sm text-gray-900">
                    Name
                  </label>
                  <input
                    type="text"
                    id="member2Name"
                    name="member2Name"
                    value={formData.member2Name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label htmlFor="member2Email" className="block mb-1 text-sm text-gray-900">
                    Email
                  </label>
                  <input
                    type="email"
                    id="member2Email"
                    name="member2Email"
                    value={formData.member2Email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
              </div>

              {/* Member 3 */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Member 3 (Optional)</h4>
                <div>
                  <label htmlFor="member3Name" className="block mb-1 text-sm text-gray-900">
                    Name
                  </label>
                  <input
                    type="text"
                    id="member3Name"
                    name="member3Name"
                    value={formData.member3Name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label htmlFor="member3Email" className="block mb-1 text-sm text-gray-900">
                    Email
                  </label>
                  <input
                    type="email"
                    id="member3Email"
                    name="member3Email"
                    value={formData.member3Email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Register Team
          </button>
        </form>
      </div>
    </div>
  )
}

export default Registration
