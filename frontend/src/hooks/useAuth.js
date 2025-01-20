import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { jwtDecode } from 'jwt-decode'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  const isAdmin = () => {
    try {
      console.log('isAdmin called');
      const tokenString = localStorage.getItem('token')
      if (!tokenString) return false
      
      const { access } = JSON.parse(tokenString)
      const decoded = jwtDecode(access)
      return decoded.is_admin === true
    } catch (error) {
      return false
    }
  }

  return {
    ...context,
    isAdmin: isAdmin()
  }
}

