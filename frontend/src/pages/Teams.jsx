import React, { useState, useEffect } from 'react'
import { getTeams } from '../api/teams'
import TeamCard from '../components/TeamCard'
import { useAuth } from '../hooks/useAuth'

function Teams() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const fetchedTeams = await getTeams(user.token)
      setTeams(fetchedTeams)
      setLoading(false)
    } catch (error) {
      setError('Failed to fetch teams')
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Teams</h2>
      {teams.length === 0 ? (
        <p>No teams found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Teams

