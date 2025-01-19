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
    <div className="dark-content">
      <h2 className="text-2xl font-semibold mb-4">Scoreboard</h2>
      {error && <p className="text-red-400 mb-4">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full dark-table rounded-lg overflow-hidden">
          <thead>
            <tr>
              <th className="p-2 text-left">Rank</th>
              <th className="p-2 text-left">Team</th>
              <th className="p-2 text-left">Score</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score, index) => (
              <tr key={score.teamId}>
                <td className="p-2">{index + 1}</td>
                <td className="p-2">{score.teamName}</td>
                <td className="p-2">{score.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Scoreboard

