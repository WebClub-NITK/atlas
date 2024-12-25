import React, { useState, useEffect } from 'react'
import { getScoreboard } from '../api/scoreboard'
import { useAuth } from '../hooks/useAuth'

function Scoreboard() {
  const [scores, setScores] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchScoreboard()
  }, [])

  const fetchScoreboard = async () => {
    try {
      const scoreboard = await getScoreboard(user.token)
      setScores(scoreboard)
      setLoading(false)
    } catch (err) {
      setError('Failed to fetch scoreboard')
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Scoreboard</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <table className="w-full">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 text-left">Rank</th>
            <th className="p-2 text-left">Team</th>
            <th className="p-2 text-left">Score</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, index) => (
            <tr key={score.teamId} className={index % 2 === 0 ? 'bg-gray-100' : ''}>
              <td className="p-2">{index + 1}</td>
              <td className="p-2">{score.teamName}</td>
              <td className="p-2">{score.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Scoreboard

