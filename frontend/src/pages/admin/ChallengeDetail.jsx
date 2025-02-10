import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { getChallengeById, updateChallenge, deleteChallenge, getChallengeSubmissions } from "../../api/challenges"
import LoadingSpinner from "../../components/LoadingSpinner"

function EditChallengeModal({ challenge, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: challenge.title || '',
    description: challenge.description || '',
    category: challenge.category || '',
    max_points: challenge.max_points || 0,
    docker_image: null, // Changed to null for file handling
    flag: challenge.flag || '',
    is_hidden: challenge.is_hidden || false,
    hints: typeof challenge.hints === 'string' ? JSON.parse(challenge.hints) : [],
    file_links: typeof challenge.file_links === 'string' ? JSON.parse(challenge.file_links) : []  
  });

  const [newHint, setNewHint] = useState({ content: '', cost: 0 });
  const [newFileLink, setNewFileLink] = useState('');
  const [fileName, setFileName] = useState(challenge.docker_image || ''); // For displaying filename

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === 'docker_image' && files?.length > 0) {
      setFormData(prev => ({
        ...prev,
        docker_image: files[0]
      }));
      setFileName(files[0].name);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value
      }));
    }
  };

  const handleAddHint = () => {
    if (newHint.content && newHint.cost) {
      setFormData(prev => ({
        ...prev,
        hints: [...prev.hints, newHint]
      }));
      setNewHint({ content: '', cost: 0 });
    }
  };

  const handleRemoveHint = (index) => {
    setFormData(prev => ({
      ...prev,
      hints: prev.hints.filter((_, i) => i !== index)
    }));
  };

  const handleAddFileLink = () => {
    if (newFileLink) {
      setFormData(prev => ({
        ...prev,
        file_links: [...prev.file_links, newFileLink]
      }));
      setNewFileLink('');
    }
  };

  const handleRemoveFileLink = (index) => {
    setFormData(prev => ({
      ...prev,
      file_links: prev.file_links.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
  
    // Add validation and default values for required fields
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('max_points', formData.max_points || 0); // Default to 0 if null
    formDataToSend.append('flag', formData.flag);
    formDataToSend.append('is_hidden', formData.is_hidden);
    
    // Only append if arrays have items
    if (formData.hints && formData.hints.length > 0) {
      formDataToSend.append('hints', JSON.stringify(formData.hints));
    }
    
    if (formData.file_links && formData.file_links.length > 0) {
      formDataToSend.append('file_links', JSON.stringify(formData.file_links));
    }
  
    // Only append docker_image if it's a new file
    if (formData.docker_image instanceof File) {
      formDataToSend.append('docker_image', formData.docker_image);
    }
  
    onSave(formDataToSend);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 mt-14">
      <div className="bg-white p-6 rounded-lg w-3/4 max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Challenge</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Max Points</label>
            <input
              type="number"
              name="max_points"
              value={formData.max_points}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Docker Image</label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                name="docker_image"
                onChange={handleChange}
                className="hidden"
                id="docker-image-upload"
                accept=".tar,.tar.gz"
              />
              <label
                htmlFor="docker-image-upload"
                className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Choose Docker Image
              </label>
              <span className="text-gray-600">
                {fileName || 'No file chosen'}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Accepted formats: .tar, .tar.gz
            </p>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Flag</label>
            <input
              type="text"
              name="flag"
              value={formData.flag}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              <input
                type="checkbox"
                name="is_hidden"
                checked={formData.is_hidden}
                onChange={handleChange}
                className="mr-2"
              />
              Hidden Challenge
            </label>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Hints</label>
            <div className="space-y-2">
              {formData.hints.map((hint, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={hint.content}
                    readOnly
                    className="flex-grow border rounded px-2 py-1"
                  />
                  <input
                    type="number"
                    value={hint.cost}
                    readOnly
                    className="w-20 border rounded px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveHint(index)}
                    className="text-red-500"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newHint.content}
                  onChange={(e) => setNewHint({...newHint, content: e.target.value})}
                  placeholder="Hint content"
                  className="flex-grow border rounded px-2 py-1"
                />
                <input
                  type="number"
                  value={newHint.cost}
                  onChange={(e) => setNewHint({...newHint, cost: parseInt(e.target.value)})}
                  placeholder="Cost"
                  className="w-20 border rounded px-2 py-1"
                />
                <button
                  type="button"
                  onClick={handleAddHint}
                  className="text-green-500"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">File Links</label>
            <div className="space-y-2">
              {formData.file_links.map((link, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={link}
                    readOnly
                    className="flex-grow border rounded px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFileLink(index)}
                    className="text-red-500"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newFileLink}
                  onChange={(e) => setNewFileLink(e.target.value)}
                  placeholder="Add file link"
                  className="flex-grow border rounded px-2 py-1"
                />
                <button
                  type="button"
                  onClick={handleAddFileLink}
                  className="text-green-500"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChallengeDetail() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!challengeId) {
        setError("No challenge ID provided");
        setLoading(false);
        return;
      }

      try {
        const challengeData = await getChallengeById(challengeId);
        if (typeof challengeData.hints === 'string') {
          challengeData.hints = JSON.parse(challengeData.hints);
        }
        if (typeof challengeData.file_links === 'string') {
          try {
            challengeData.file_links = JSON.parse(challengeData.file_links);
          } catch (e) {
            console.error("Failed to parse file_links:", e);
            challengeData.file_links = [];
            setError("Failed to parse file links");
          }
        }
        setChallenge(challengeData);

        const submissionsData = await getChallengeSubmissions(challengeId);
        setSubmissions(submissionsData);
        
        setError(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load challenge data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [challengeId]);

  const fetchSubmissions = async () => {
    try {
      const submissionsData = await getChallengeSubmissions(challengeId)
      setSubmissions(submissionsData)
    } catch (error) {
      console.error("Error fetching submissions:", error)
      setError("Failed to load submissions.")
    }
  }

  const fetchChallenge = async () => {
    setLoading(true)
    try {
      const data = await getChallengeById(challengeId)
      setChallenge(data)
    } catch (error) {
      console.error("Error fetching challenge:", error)
      setError("Failed to load challenge.")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateChallenge = async (updatedData) => {
    try {
      await updateChallenge(challengeId, updatedData);
      
      const newChallengeData = await getChallengeById(challengeId);
      if (typeof newChallengeData.hints === 'string') {
        newChallengeData.hints = JSON.parse(newChallengeData.hints);
      }
      
      setChallenge(newChallengeData);
      
      const newSubmissionsData = await getChallengeSubmissions(challengeId);
      setSubmissions(newSubmissionsData);
      
      setIsEditModalOpen(false);
      setError(null);
    } catch (error) {
      console.error("Error updating challenge:", error);
      setError("Failed to update challenge.");
    }
  };

  const handleDeleteChallenge = async () => {
    if (window.confirm("Are you sure you want to delete this challenge?")) {
      try {
        await deleteChallenge(challengeId)
        navigate("/admin/challenges")
      } catch (error) {
        console.error("Error deleting challenge:", error)
        setError("Failed to delete challenge.")
      }
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  if (!challenge) {
    return <div className="text-gray-500">Challenge not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">{challenge.title}</h1>
            <div>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteChallenge}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Delete
              </button>
            </div>
          </div>
        </header>

        <section className="mb-6 bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
          <p className="text-gray-700">{challenge.description}</p>
        </section>

        <section className="mb-6 bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-700 font-bold">Category:</span>
              <span className="text-gray-600 ml-1">{challenge.category}</span>
            </div>
            <div>
              <span className="text-gray-700 font-bold">Points:</span>
              <span className="text-gray-600 ml-1">{challenge.max_points}</span>
            </div>
            <div>
              <span className="text-gray-700 font-bold">Docker Image:</span>
              <span className="text-gray-600 ml-1">{challenge.docker_image || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-700 font-bold">Flag:</span>
              <span className="text-gray-600 ml-1">{challenge.flag}</span>
            </div>
            <div>
              <span className="text-gray-700 font-bold">Is Hidden:</span>
              <span className="text-gray-600 ml-1">{challenge.is_hidden ? "Yes" : "No"}</span>
            </div>
          </div>
        </section>

        {/* Hints Section */}
        {challenge.hints && Array.isArray(challenge.hints) && challenge.hints.length > 0 ? (
          <section className="mb-6 bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Hints</h2>
            <div className="space-y-4">
              {challenge.hints.map((hint, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Hint {index + 1}</span>
                    <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-lg">
                      Cost: {hint.cost} points
                    </span>
                  </div>
                  <p className="text-gray-700">{hint.content}</p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="mb-6 bg-gray-100 rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Hints</h2>
            <p className="text-gray-500">No hints available for this challenge.</p>
          </section>
        )}

        {challenge.file_links && Array.isArray(challenge.file_links) && challenge.file_links.length > 0 ? (
          <section className="mb-6 bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">File Links</h2>
            <div className="space-y-4">
              {challenge.file_links.map((link, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <a 
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                  >
                    {link}
                  </a>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="mb-6 bg-gray-100 rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">File Links</h2>
            <p className="text-gray-500">No file links available for this challenge.</p>
          </section>
        )}

        

        <section className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Submissions</h2>
          {submissions && submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submission Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Correct
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission.team ? (
                          <Link to={`/admin/teams/${submission.team.id}`} className="text-blue-500 hover:underline">
                            {submission.team.name}
                          </Link>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(submission.submission_time).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{submission.correct ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No submissions yet for this challenge.</p>
          )}
        </section>

        {isEditModalOpen && (
          <EditChallengeModal
            challenge={challenge}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleUpdateChallenge}
          />
        )}
      </div>
    </div>
  )
}

export default ChallengeDetail