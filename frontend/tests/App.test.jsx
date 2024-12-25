import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../src/context/AuthContext'
import App from '../src/App'

test('renders app with navbar', () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  )
  const navElement = screen.getByRole('navigation')
  expect(navElement).toBeInTheDocument()
})

