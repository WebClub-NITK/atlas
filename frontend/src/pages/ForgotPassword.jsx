import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../api/auth'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setMessage('')

    try {
      await requestPasswordReset(email)
      setMessage('Password reset instructions have been sent to your email.')
      setEmail('')
    } catch (err) {
      setError('Failed to process password reset request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <h2 className="text-2xl font-semibold mb-4">Forgot Password</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {message && <p className="text-green-500 mb-4">{message}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-2">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            required
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-primary w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Reset Password'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <Link to="/login" className="text-blue-600 hover:text-blue-800">
          Back to Login
        </Link>
      </div>
    </div>
  )
}

export default ForgotPassword
