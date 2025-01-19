import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getChallengeById, updateChallenge, deleteChallenge } from '../../api/challenges';
import { getUserById } from '../../data/dummyUsers';
import { dummyUsers } from '../../data/dummyUsers';
import { dummyTeams } from '../../data/dummyTeams';

function EditChallengeModal({ challenge, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: challenge.title,
    description: challenge.description,
    category: challenge.category,
    max_points: challenge.max_points,
    docker_image: challenge.docker_image,
    flag: challenge.flag,
    is_hidden: challenge.is_hidden,
    hints: [...challenge.hints],
    file_links: [...challenge.file_links]
  });

  const categoryOptions = [
    'web',
    'crypto',
    'pwn',
    'reverse',
    'forensics',
    'misc'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error updating challenge:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Edit Challenge</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-medium">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
              required
            >
              {categoryOptions.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Points</label>
            <input
              type="number"
              value={formData.max_points}
              onChange={(e) => setFormData({...formData, max_points: parseInt(e.target.value)})}
              className="w-full border rounded-lg px-4 py-2"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Docker Image</label>
            <input
              type="text"
              value={formData.docker_image}
              onChange={(e) => setFormData({...formData, docker_image: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Flag</label>
            <input
              type="text"
              value={formData.flag}
              onChange={(e) => setFormData({...formData, flag: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_hidden}
                onChange={(e) => setFormData({...formData, is_hidden: e.target.checked})}
                className="mr-2"
              />
              <span>Hidden Challenge</span>
            </label>
          </div>

          <div>
            <label className="block mb-2 font-medium">Hints</label>
            <div className="space-y-4">
              {formData.hints.map((hint, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Hint {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newHints = formData.hints.filter((_, i) => i !== index);
                        setFormData({...formData, hints: newHints});
                      }}
                      className="text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={hint.content}
                        onChange={(e) => {
                          const newHints = [...formData.hints];
                          newHints[index] = { ...hint, content: e.target.value };
                          setFormData({...formData, hints: newHints});
                        }}
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="Hint content"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={hint.cost}
                        onChange={(e) => {
                          const newHints = [...formData.hints];
                          newHints[index] = { ...hint, cost: parseInt(e.target.value) };
                          setFormData({...formData, hints: newHints});
                        }}
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="Cost"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  hints: [...formData.hints, { content: '', cost: 0 }]
                })}
                className="px-4 py-2 bg-green-500 text-white rounded-lg"
              >
                Add Hint
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-2 font-medium">File Links</label>
            <div className="space-y-2">
              {formData.file_links.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={link}
                    onChange={(e) => {
                      const newLinks = [...formData.file_links];
                      newLinks[index] = e.target.value;
                      setFormData({...formData, file_links: newLinks});
                    }}
                    className="flex-grow border rounded-lg px-4 py-2"
                    placeholder="Enter file link URL"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newLinks = formData.file_links.filter((_, i) => i !== index);
                      setFormData({...formData, file_links: newLinks});
                    }}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  file_links: [...formData.file_links, '']
                })}
                className="px-4 py-2 bg-green-500 text-white rounded-lg"
              >
                Add File Link
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
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
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Placeholder dummy data for submissions (temporary)
  const dummySubmissions = {
    correct: [
      {
        id: 1,
        userId: 1,
        teamId: 1,
        submittedAt: new Date().toISOString(),
        username: "user1",
        teamName: "Team Alpha",
      },
      {
        id: 2,
        userId: 2,
        teamId: 1,
        submittedAt: new Date().toISOString(),
        username: "user2",
        teamName: "Team Alpha",
      }
    ],
    incorrect: [
      {
        id: 3,
        userId: 3,
        teamId: 2,
        submittedAt: new Date().toISOString(),
        username: "user3",
        teamName: "Team Beta",
        submission: "wrong_flag{123}"
      },
      {
        id: 4,
        userId: 4,
        teamId: 2,
        submittedAt: new Date().toISOString(),
        username: "user4",
        teamName: "Team Beta",
        submission: "incorrect_flag{456}"
      }
    ]
  };

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const data = await getChallengeById(id);
        console.log(data)
        setChallenge(data);
      } catch (err) {
        setError('Failed to fetch challenge details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [id]);

  const handleSaveChallenge = async (updatedData) => {
    try {
      await updateChallenge(updatedData, id);
      setChallenge(updatedData);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating challenge:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this challenge?')) {
      try {
        await deleteChallenge(id);
        navigate('/admin/challenges');
      } catch (error) {
        console.error('Error deleting challenge:', error);
        alert('Failed to delete challenge');
      }
    }
  };

  const getUserById = (userId) => dummyUsers.find(user => user.id === userId);
  const getTeamById = (teamId) => dummyTeams.find(team => team.id === teamId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!challenge) return <div>Challenge not found</div>;

  // Using placeholder data instead of real submissions
  const correctSubmissions = dummySubmissions.correct;
  const incorrectSubmissions = dummySubmissions.incorrect;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Challenge Details</h1>
          <button
            onClick={() => navigate('/admin/challenges')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Challenges
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-4xl font-bold text-gray-900">{challenge.title}</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(true)}
                className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Edit Challenge
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete Challenge
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
              {challenge.category}
            </span>
            <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg font-medium">
              Standard
            </span>
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
              {challenge.max_points} points
            </span>
            <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg font-medium">
              {correctSubmissions.length} solves
            </span>
            {challenge.is_hidden && (
              <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-medium">
                Hidden
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 text-lg leading-relaxed">{challenge.description}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Flag</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <code className="text-lg font-mono text-gray-800">{challenge.flag}</code>
            </div>
          </div>

          {challenge.hints && challenge.hints.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Hints</h2>
              <div className="space-y-4">
                {challenge.hints.map((hint, index) => (
                  <div key={hint.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-lg text-gray-700">Hint {index + 1}</span>
                      <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-lg">
                        Cost: {hint.cost} points
                      </span>
                    </div>
                    <p className="text-gray-700">{hint.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {challenge.file_links && challenge.file_links.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Files</h2>
              <div className="space-y-2">
                {challenge.file_links.map((link, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <span className="font-medium text-gray-700">
                      {link.split('/').pop() || link}
                    </span>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 font-medium flex items-center gap-2"
                    >
                      <span>Open Link</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Submissions (Placeholder Data)</h2>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-green-600 mb-4">
                Correct Submissions ({correctSubmissions.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-gray-600 font-medium">User</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-gray-600 font-medium">Team</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-gray-600 font-medium">Solved At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {correctSubmissions.map((sub, index) => {
                      const user = dummyUsers.find(u => u.id === sub.userId);
                      const team = dummyTeams.find(t => t.id === sub.teamId);
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4">
                            <Link 
                              to={`/admin/users/${user.id}`}
                              className="text-blue-500 hover:text-blue-600 font-medium"
                            >
                              {user.username}
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <Link 
                              to={`/admin/teams/${team.id}`}
                              className="text-blue-500 hover:text-blue-600 font-medium"
                            >
                              {team.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {new Date(sub.submittedAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-red-600 mb-4">
                Incorrect Submissions ({incorrectSubmissions.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-gray-600 font-medium">User</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-gray-600 font-medium">Team</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-gray-600 font-medium">Attempted At</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-gray-600 font-medium">Submission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {incorrectSubmissions.map((sub, index) => {
                      const user = dummyUsers.find(u => u.id === sub.userId);
                      const team = dummyTeams.find(t => t.id === sub.teamId);
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4">
                            <Link 
                              to={`/admin/users/${user.id}`}
                              className="text-blue-500 hover:text-blue-600 font-medium"
                            >
                              {user.username}
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <Link 
                              to={`/admin/teams/${team.id}`}
                              className="text-blue-500 hover:text-blue-600 font-medium"
                            >
                              {team.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {new Date(sub.submittedAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <code className="font-mono bg-gray-100 px-2 py-1 rounded">
                              {sub.submission}
                            </code>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditChallengeModal
          challenge={challenge}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveChallenge}
        />
      )}
    </div>
  );
}

export default ChallengeDetail; 