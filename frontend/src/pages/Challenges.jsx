// import React, { useState, useEffect } from 'react';
// import { getChallenges } from '../api/challenges';
// import ChallengeCard from '../components/ChallengeCard';
// import { getChallengeCategories } from '../data/dummyChallenges';

// function Challenges() {
//   const [challenges, setChallenges] = useState([]);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [selectedCategory, setSelectedCategory] = useState('all');

//   useEffect(() => {
//     const fetchChallenges = async () => {
//       try {
//         setLoading(true);
//         const data = await getChallenges();
//         console.log(data);
//         setChallenges(data);
//       } catch (err) {
//         console.error('Error fetching challenges:', err);
//         setError('Failed to fetch challenges');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchChallenges();
//   }, []);

//   // Group challenges by category
//   const challengesByCategory = challenges.reduce((acc, challenge) => {
//     if (!acc[challenge.category]) {
//       acc[challenge.category] = [];
//     }
//     acc[challenge.category].push(challenge);
//     return acc;
//   }, {});

//   const categories = ['all', ...Object.keys(challengesByCategory)];

//   if (loading) return <div>Loading challenges...</div>;

//   return (
//     <div className="responsive-padding">
//       {/* Category Filter */}
//       <div className="mb-6">
//         <div className="flex gap-2 overflow-x-auto pb-2">
//           {categories.map(category => (
//             <button
//               key={category}
//               onClick={() => setSelectedCategory(category)}
//               className={`px-4 py-2 rounded-full text-sm font-medium ${
//                 selectedCategory === category
//                   ? 'bg-blue-500 text-white'
//                   : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//               }`}
//             >
//               {category.charAt(0).toUpperCase() + category.slice(1)}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Challenges Display */}
//       {selectedCategory === 'all' ? (
//         // Show all categories
//         Object.entries(challengesByCategory).map(([category, categoryChallenges]) => (
//           <div key={category} className="mb-8">
//             <h2 className="text-2xl font-semibold mb-4 capitalize">
//               {category} Challenges
//             </h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {categoryChallenges.map(challenge => (
//                 <ChallengeCard key={challenge.id} challenge={challenge} />
//               ))}
//             </div>
//           </div>
//         ))
//       ) : (
//         // Show selected category
//         <div>
//           <h2 className="text-2xl font-semibold mb-4 capitalize">
//             {selectedCategory} Challenges
//           </h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {challengesByCategory[selectedCategory]?.map(challenge => (
//               <ChallengeCard key={challenge.id} challenge={challenge} />
//             ))}
//           </div>
//         </div>
//       )}

//       {error && <p className="text-red-500 mt-4">{error}</p>}
//     </div>
//   );
// }

// export default Challenges;

import React, { useState, useEffect } from "react"
import { getChallenges } from "../api/challenges"
import ChallengeCard from "../components/ChallengeCard"

export default function Challenges() {
  const [challenges, setChallenges] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

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
        }))
        setChallenges(updatedData)
      } catch (err) {
        console.error("Error fetching challenges:", err)
        setError("Failed to fetch challenges. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchChallenges()
  }, [])

  const categories = ["all", ...new Set(challenges.map((ch) => ch.category))]

  const filteredChallenges = challenges.filter(
    (challenge) =>
      (selectedCategory === "all" || challenge.category === selectedCategory) &&
      (challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-red-500">Challenges</h1>

      <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search challenges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-md capitalize ${
                selectedCategory === category ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
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
        <p className="text-center text-gray-500 mt-8">No challenges found matching your criteria.</p>
      )}
    </div>
  )
}

