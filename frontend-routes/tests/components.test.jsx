import React from 'react'
import { render, screen } from '@testing-library/react'
import TeamCard from '../src/components/TeamCard'

test('renders team card with correct information', () => {
  const team = {
    name: 'Test Team',
    members: ['Alice', 'Bob'],
    score: 1000
  }

  render(<TeamCard team={team} />)

  expect(screen.getByText('Test Team')).toBeInTheDocument()
  expect(screen.getByText('Members: Alice, Bob')).toBeInTheDocument()
  expect(screen.getByText('Score: 1000')).toBeInTheDocument()
})

