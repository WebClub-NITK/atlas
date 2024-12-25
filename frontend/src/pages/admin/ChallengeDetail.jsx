import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getChallengeById } from '../../data/dummyChallenges';
import { getUserById } from '../../data/dummyUsers';
import { dummyUsers } from '../../data/dummyUsers';
import { dummyTeams } from '../../data/dummyTeams';

function EditChallengeModal({ challenge, onClose, onSave }) {
  const [formData, setFormData] = useState({
    ...challenge,
    newHint: { content: '', cost: 0 }
  });

  const addHint = () => {
    if (formData.newHint.content) {
      setFormData({
        ...formData,
        hints: [...formData.hints, { ...formData.newHint, id: Date.now() }],
        newHint: { content: '', cost: 0 }
      });
    }
  };

  const removeHint = (hintId) => {
    setFormData({
      ...formData,
      hints: formData.hints.filter(hint => hint.id !== hintId)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Remove the newHint field before saving
    const { newHint, ...challengeData } = formData;
    
    // TODO: Validate the data before saving
    // - Check if name is not empty
    // - Check if value is a positive number
    // - Check if flag is not empty
    // - Validate hints have content and valid costs
    
    onSave(challengeData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Challenge</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-medium">Name</label>
            <input
              type="text"
              className="w-full border rounded-lg px-4 py-2"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Description</label>
            <textarea
              className="w-full border rounded-lg px-4 py-2"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Value</label>
            <input
              type="number"
              className="w-full border rounded-lg px-4 py-2"
              value={formData.value}
              onChange={(e) => setFormData({...formData, value: parseInt(e.target.value)})}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Flag</label>
            <input
              type="text"
              className="w-full border rounded-lg px-4 py-2"
              value={formData.flag}
              onChange={(e) => setFormData({...formData, flag: e.target.value})}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Hints</label>
            <div className="space-y-4">
              {formData.hints.map(hint => (
                <div key={hint.id} className="flex gap-4 items-center bg-gray-50 p-4 rounded-lg">
                  <div className="flex-grow">
                    <input
                      type="text"
                      className="w-full border rounded-lg px-4 py-2 mb-2"
                      value={hint.content}
                      onChange={(e) => {
                        const updatedHints = formData.hints.map(h =>
                          h.id === hint.id ? {...h, content: e.target.value} : h
                        );
                        setFormData({...formData, hints: updatedHints});
                      }}
                    />
                    <input
                      type="number"
                      className="w-full border rounded-lg px-4 py-2"
                      value={hint.cost}
                      onChange={(e) => {
                        const updatedHints = formData.hints.map(h =>
                          h.id === hint.id ? {...h, cost: parseInt(e.target.value)} : h
                        );
                        setFormData({...formData, hints: updatedHints});
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeHint(hint.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <div className="flex gap-4">
                <input
                  type="text"
                  className="flex-grow border rounded-lg px-4 py-2"
                  placeholder="New hint content"
                  value={formData.newHint.content}
                  onChange={(e) => setFormData({
                    ...formData,
                    newHint: {...formData.newHint, content: e.target.value}
                  })}
                />
                <input
                  type="number"
                  className="w-32 border rounded-lg px-4 py-2"
                  placeholder="Cost"
                  value={formData.newHint.cost}
                  onChange={(e) => setFormData({
                    ...formData,
                    newHint: {...formData.newHint, cost: parseInt(e.target.value)}
                  })}
                />
                <button
                  type="button"
                  onClick={addHint}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-2 font-medium">Files</label>
            <input
              type="file"
              multiple
              className="w-full border rounded-lg px-4 py-2"
              onChange={(e) => {
                const files = Array.from(e.target.files).map(file => ({
                  id: Date.now(),
                  name: file.name,
                  path: URL.createObjectURL(file)
                }));
                setFormData({...formData, files: [...formData.files, ...files]});
              }}
            />
            <div className="mt-2 space-y-2">
              {formData.files.map(file => (
                <div key={file.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      files: formData.files.filter(f => f.id !== file.id)
                    })}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
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
  const [challenge, setChallenge] = useState(getChallengeById(id));
  const [showEditModal, setShowEditModal] = useState(false);

  const handleSaveChallenge = (updatedChallenge) => {
    // TODO: Implement PUT request to /api/challenges/:id
    // Example API call:
    // await axios.put(`/api/challenges/${id}`, updatedChallenge);
    
    // For now, update the frontend state
    setChallenge(updatedChallenge);
    setShowEditModal(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this challenge?')) {
      // TODO: Implement DELETE request to /api/challenges/:id
      // Example API call:
      // await axios.delete(`/api/challenges/${id}`);
      
      navigate('/admin/challenges');
    }
  };

  const getUserById = (userId) => dummyUsers.find(user => user.id === userId);
  const getTeamById = (teamId) => dummyTeams.find(team => team.id === teamId);

  if (!challenge) {
    return <div>Challenge not found</div>;
  }

  const correctSubmissions = challenge.submissions.filter(sub => sub.isCorrect);
  const incorrectSubmissions = challenge.submissions.filter(sub => !sub.isCorrect);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-4xl font-bold text-gray-900">{challenge.name}</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(true)}
                className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Edit Challenge
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this challenge?')) {
                    navigate('/admin/challenges');
                  }
                }}
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
              {challenge.type}
            </span>
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
              {challenge.value} points
            </span>
            <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg font-medium">
              {correctSubmissions.length} solves
            </span>
            {challenge.isHidden && (
              <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-medium">
                Hidden
              </span>
            )}
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 gap-6">
          {/* Description Section */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 text-lg leading-relaxed">{challenge.description}</p>
          </div>

          {/* Flag Section */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Flag</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <code className="text-lg font-mono text-gray-800">{challenge.flag}</code>
            </div>
          </div>

          {/* Hints Section */}
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

          {/* Files Section */}
          {challenge.files && challenge.files.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Files</h2>
              <div className="grid gap-4">
                {challenge.files.map(file => (
                  <div key={file.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <span className="font-medium text-gray-700">{file.name}</span>
                    <a
                      href={file.path}
                      download
                      className="text-blue-500 hover:text-blue-600 font-medium"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solves Section */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Submissions</h2>
            
            {/* Correct Submissions */}
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

            {/* Incorrect Submissions */}
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