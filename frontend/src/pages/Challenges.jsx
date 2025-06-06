import React, { useState, useEffect } from "react"
import { getChallenges } from "../api/challenges"
import ChallengeCard from "../components/ChallengeCard"
import { useNavigate } from "react-router-dom"

export default function Challenges() {
  const [challenges, setChallenges] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoading(true)
        const data = await getChallenges()
        const updatedData = data.map((ch) => ({
          id: ch.id,
          title: ch.title,
          description: ch.description,
          category: ch.category || "Other",
          max_points: ch.max_points,
          hints: ch.hints,
          file_links: ch.file_links,
          docker_image: ch.docker_image,
          tries: ch.tries,
          is_correct: ch.is_correct,
        }))
        setChallenges(updatedData)
      } catch (error) {
        console.error('Error fetching challenges:', error)
        
        // Handle team requirement error
        if (error.response?.status === 403 && error.response?.data?.error?.includes('team')) {
          setError('You must join or create a team to access challenges')
          navigate('/team-setup')
        } else {
          setError('Failed to load challenges')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchChallenges()
  }, [navigate])

  const categories = ["all", ...new Set(challenges.map((ch) => ch.category))]

  const filteredChallenges = challenges.filter(
    (challenge) =>
      (selectedCategory === "all" || challenge.category === selectedCategory) &&
      (challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-red-500">Challenges</h1>

        <div className="rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="w-full md:w-1/3">
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-md capitalize text-gray-900 ${
                    selectedCategory === category 
                      ? "bg-red-400 font-semibold" 
                      : "bg-indigo-400 hover:bg-indigo-500"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        ) : filteredChallenges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        ) : (
          <div className="bg-[#FFF7ED] rounded-lg shadow p-6 text-center">
            <p className="text-gray-900">No challenges found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
