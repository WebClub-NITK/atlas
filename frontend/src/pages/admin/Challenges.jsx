import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dummyChallenges, getChallengeCategories, getChallengeTypes } from '../../data/dummyChallenges';

function ChallengeFormModal({ challenges, onClose, onSave }) {
  const [formData, setFormData] = useState({
    category: '',
    value: '',
    isHidden: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">
          Edit Challenges ({challenges.length} selected)
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Category</label>
              <input
                type="text"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="Leave blank for no change"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Value (Points)</label>
              <input
                type="number"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
                placeholder="Leave blank for no change"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Visibility</label>
              <select
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.isHidden}
                onChange={(e) => setFormData({...formData, isHidden: e.target.value})}
              >
                <option value="">No Change</option>
                <option value="false">Visible</option>
                <option value="true">Hidden</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Challenges() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState(dummyChallenges);
  const [selectedChallenges, setSelectedChallenges] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filteredChallenges = challenges.filter(challenge =>
    challenge.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectChallenge = (id) => {
    setSelectedChallenges(prev =>
      prev.includes(id)
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  };

  const handleEditClick = () => {
    if (selectedChallenges.length === 0) {
      alert('Please select challenges to edit');
      return;
    }
    setShowModal(true);
  };

  const handleDeleteChallenges = () => {
    if (selectedChallenges.length === 0) {
      alert('Please select challenges to delete');
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${selectedChallenges.length} challenge(s)?`)) {
      setChallenges(challenges.filter(challenge => !selectedChallenges.includes(challenge.id)));
      setSelectedChallenges([]);
    }
  };

  const handleSaveChallenge = (challengeData) => {
    setChallenges(challenges.map(challenge => {
      if (!selectedChallenges.includes(challenge.id)) return challenge;
      return {
        ...challenge,
        ...(challengeData.category && { category: challengeData.category }),
        ...(challengeData.value && { value: parseInt(challengeData.value) }),
        ...(challengeData.isHidden !== '' && { isHidden: challengeData.isHidden === 'true' })
      };
    }));
    setShowModal(false);
    setSelectedChallenges([]);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Challenges</h1>
          <div className="flex space-x-3">
            <Link
              to="/admin/challenges/create"
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Challenge
            </Link>
            <button
              onClick={handleEditClick}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
              disabled={selectedChallenges.length === 0}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Selected
            </button>
            <button
              onClick={handleDeleteChallenges}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
              disabled={selectedChallenges.length === 0}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Selected
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search challenges by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg 
              className="h-5 w-5 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="w-12 px-4 py-2 text-center">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedChallenges(filteredChallenges.map(challenge => challenge.id));
                    } else {
                      setSelectedChallenges([]);
                    }
                  }}
                  checked={selectedChallenges.length === filteredChallenges.length}
                />
              </th>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-center">Value</th>
              <th className="w-24 px-4 py-2 text-center">Hidden</th>
            </tr>
          </thead>
          <tbody>
            {filteredChallenges.map(challenge => (
              <tr key={challenge.id} className="border-t">
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedChallenges.includes(challenge.id)}
                    onChange={() => handleSelectChallenge(challenge.id)}
                  />
                </td>
                <td className="px-4 py-2">{challenge.id}</td>
                <td className="px-4 py-2">
                  <Link 
                    to={`/admin/challenges/${challenge.id}`}
                    className="text-blue-500 hover:underline"
                  >
                    {challenge.name}
                  </Link>
                </td>
                <td className="px-4 py-2">{challenge.category}</td>
                <td className="px-4 py-2">{challenge.type}</td>
                <td className="px-4 py-2 text-center">{challenge.value}</td>
                <td className="px-4 py-2 text-center">
                  {challenge.isHidden && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Hidden
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ChallengeFormModal
          challenges={challenges.filter(challenge => selectedChallenges.includes(challenge.id))}
          onClose={() => setShowModal(false)}
          onSave={handleSaveChallenge}
        />
      )}
    </div>
  );
}

export default Challenges; 