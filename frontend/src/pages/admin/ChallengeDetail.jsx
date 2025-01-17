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
    max_points: challenge.max_points,
    flag: challenge.flag,
    file_links: challenge.file_links || [],
    hints: challenge.hints || [],
    newHint: { content: '', cost: 0 }
  });

  const addHint = () => {
    if (formData.newHint.content) {
      setFormData({
        ...formData,
        hints: [...formData.hints, { ...formData.newHint }],
        newHint: { content: '', cost: 0 }
      });
    }
  };

  const removeHint = (index) => {
    setFormData({
      ...formData,
      hints: formData.hints.filter((_, i) => i !== index)
    });
  };

  const addFileLink = () => {
    setFormData({
      ...formData,
      file_links: [...formData.file_links, '']
    });
  };

  const removeFileLink = (index) => {
    setFormData({
      ...formData,
      file_links: formData.file_links.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
  
      
      await onSave({
        title: formData.title,
        description: formData.description,
        max_points: (formData.max_points),
        flag: formData.flag,
        file_links: formData.file_links,
        hints: formData.hints
      });
      onClose();
    } catch (error) {
      console.error('Error updating challenge:', error);
      alert('Failed to update challenge');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Challenge</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-medium">Title</label>
            <input
              type="text"
              className="w-full border rounded-lg px-4 py-2"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
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
            <label className="block mb-2 font-medium">Points</label>
            <input
              type="number"
              className="w-full border rounded-lg px-4 py-2"
              value={formData.max_points}
              onChange={(e) => setFormData({...formData, max_points: e.target.value})}
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
            <label className="block mb-2 font-medium">File Links</label>
            <div className="space-y-2">
              {formData.file_links.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    className="flex-grow border rounded-lg px-4 py-2"
                    value={link}
                    onChange={(e) => {
                      const newLinks = [...formData.file_links];
                      newLinks[index] = e.target.value;
                      setFormData({...formData, file_links: newLinks});
                    }}
                    placeholder="Enter file link URL"
                  />
                  <button
                    type="button"
                    onClick={() => removeFileLink(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFileLink}
                className="px-4 py-2 bg-green-500 text-white rounded-lg"
              >
                Add File Link
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-2 font-medium">Hints</label>
            <div className="space-y-4">
              {formData.hints.map((hint, index) => (
                <div key={index} className="flex gap-4 items-center bg-gray-50 p-4 rounded-lg">
                  <div className="flex-grow">
                    <input
                      type="text"
                      className="w-full border rounded-lg px-4 py-2 mb-2"
                      value={hint.content}
                      onChange={(e) => {
                        const newHints = [...formData.hints];
                        newHints[index] = { ...hint, content: e.target.value };
                        setFormData({...formData, hints: newHints});
                      }}
                      placeholder="Hint content"
                    />
                    <input
                      type="number"
                      className="w-full border rounded-lg px-4 py-2"
                      value={hint.cost}
                      onChange={(e) => {
                        const newHints = [...formData.hints];
                        newHints[index] = { ...hint, cost: parseInt(e.target.value) };
                        setFormData({...formData, hints: newHints});
                      }}
                      placeholder="Hint cost"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeHint(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-grow border rounded-lg px-4 py-2"
                  value={formData.newHint.content}
                  onChange={(e) => setFormData({
                    ...formData,
                    newHint: { ...formData.newHint, content: e.target.value }
                  })}
                  placeholder="New hint content"
                />
                <input
                  type="number"
                  className="w-32 border rounded-lg px-4 py-2"
                  value={formData.newHint.cost}
                  onChange={(e) => setFormData({
                    ...formData,
                    newHint: { ...formData.newHint, cost: parseInt(e.target.value) }
                  })}
                  placeholder="Cost"
                />
                <button
                  type="button"
                  onClick={addHint}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg"
                >
                  Add Hint
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
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

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const data = await getChallengeById(id);
        console.log('The challenge recevied is ', data)
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
      console.log('Updating challenge with data:', updatedData);
      console.log('The challenge id is', challenge.id)
      const response = await updateChallenge(updatedData, challenge.id);
      console.log('Update response:', response);
      
      // Update the local state with the new data
      setChallenge({
        ...challenge,
        ...updatedData
      });
      
      setShowEditModal(false);
      alert('Challenge updated successfully!');
    } catch (error) {
      console.error('Error updating challenge:', error);
      alert('Failed to update challenge: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
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
  if (error) return <div>Error: {error}</div>;
  if (!challenge) return <div>Challenge not found</div>;

  // const correctSubmissions = challenge.submissions.filter(sub => sub.isCorrect);
  // const incorrectSubmissions = challenge.submissions.filter(sub => !sub.isCorrect);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header Section */}
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
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this challenge?')) {
                    handleDelete(challenge.id)
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
              Standard
            </span>
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
              {challenge.max_points} points
            </span>
            {/* <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg font-medium">
              {correctSubmissions.length} solves
            </span> */}
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

          {/* File links Section */}
          {challenge.file_links && challenge.file_links.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">File Links</h2>
              <div className="grid gap-4">
                {challenge.file_links.map(file => (
                  <div key={file.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <span className="font-medium text-gray-700">{file}</span>
                    <a
                      href={file}
                      download
                      target="_blank"
                      className="text-blue-500 hover:text-blue-600 font-medium"
                    >
                      Open
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solves Section */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Submissions</h2>
            
            {/* TODO: Implement real submission logic once the submission system is in place */}
            {/* Placeholder data for demonstration purposes only */}
            
            {/* Correct Submissions */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-green-600 mb-4">
                Correct Submissions (Placeholder)
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
                    <tr>
                      <td className="px-6 py-4">User123</td>
                      <td className="px-6 py-4">TeamAlpha</td>
                      <td className="px-6 py-4 text-gray-600">2024-01-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">User456</td>
                      <td className="px-6 py-4">TeamBeta</td>
                      <td className="px-6 py-4 text-gray-600">2024-01-01 13:00:00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Incorrect Submissions */}
            <div>
              <h3 className="text-xl font-semibold text-red-600 mb-4">
                Incorrect Submissions (Placeholder)
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
                    <tr>
                      <td className="px-6 py-4">User789</td>
                      <td className="px-6 py-4">TeamGamma</td>
                      <td className="px-6 py-4 text-gray-600">2024-01-01 14:00:00</td>
                      <td className="px-6 py-4">incorrect_flag_123</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">User101</td>
                      <td className="px-6 py-4">TeamDelta</td>
                      <td className="px-6 py-4 text-gray-600">2024-01-01 15:00:00</td>
                      <td className="px-6 py-4">wrong_attempt_456</td>
                    </tr>
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