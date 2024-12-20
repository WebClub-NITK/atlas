import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Home from '../src/pages/Home'

test('renders home page with welcome message', () => {
  render(
    <BrowserRouter>
      <Home />
    </BrowserRouter>
  )
  const welcomeElement = screen.getByText(/Welcome to CTF Platform/i)
  expect(welcomeElement).toBeInTheDocument()
})

