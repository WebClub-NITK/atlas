import React from 'react'
import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-mario mb-8">404 - Page Not Found</h1>
      <p className="text-xl mb-8">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  )
}

export default NotFound
