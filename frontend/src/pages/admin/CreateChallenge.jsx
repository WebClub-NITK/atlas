import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChallengeTypes } from '../../data/dummyChallenges';
import { createChallenge } from '../../api/challenges';
import { jwtDecode } from 'jwt-decode';

function CreateChallenge() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('standard');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    message: '',
    value: '',
    flag: '',
    caseSensitive: true,
    isHidden: false,
    files: [],
    // Code specific
    language: '',
    version: '',
    // Dynamic specific
    decayFunction: 'linear',
    decayValue: '',
    minimumValue: ''
  });
  const [hints, setHints] = useState([
    { id: Date.now(), content: '', cost: 0 }
  ]);
  const [user, setUser] = useState(null);

  const programmingLanguages = [
    { name: 'Python', versions: ['3.8', '3.9', '3.10', '3.11'] },
    { name: 'JavaScript', versions: ['Node 16', 'Node 18', 'Node 20'] },
    { name: 'Java', versions: ['11', '17', '21'] },
    { name: 'C++', versions: ['C++17', 'C++20'] }
  ];

  useEffect(() => {
    const tokenData = JSON.parse(localStorage.getItem('token'));
    console.log('The token is', tokenData);
    if (!tokenData) {
      console.error('No token found - redirecting to login');
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(tokenData.access);
      setUser(decoded.user);
      console.log('The user is', decoded.user);
      
      // Strict admin check
      if (!decoded.user.isAdmin) {
        console.error('Non-admin user attempted to access admin page');
        alert('Access denied: Administrator privileges required');
        navigate('/challenges');
        return;
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('sending the requst and isnide create challenge.jsx')
    // Double-check admin status before submission
    if (!user?.isAdmin) {
      console.error('Non-admin user attempted to create challenge');
      alert('Access denied: Administrator privileges required');
      navigate('/challenges');
      return;
    }
    else{
      console.log('The user is and verified ', user);
    }

    try {
      const challengeData = {
        user: user,
        title: formData.name,
        description: formData.message,
        category: formData.category,
        docker_image: formData.language ? `${formData.language}:${formData.version}` : 'random',
        flag: formData.flag,
        max_points: parseInt(formData.value),
        max_team_size: 4,
        hints: hints.map(hint => ({
          content: hint.content,
          cost: (hint.cost)
        })),
        file_links: formData.file_links || []
      };
      console.log('The challenge data is', challengeData);
      console.log('Submitting challenge as admin:', user.email);
      const response = await createChallenge(challengeData);
      console.log('Challenge created:', response);
      alert('Challenge created successfully!');
      navigate(`/admin/challenges/${response.challenge_id}`);
    } catch (error) {
      console.error('Error creating challenge:', error);
      if (error.response?.status === 403) {
        alert('Access denied: Administrator privileges required');
        navigate('/challenges');
      } else {
        alert('Failed to create challenge: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const addHint = () => {
    setHints([...hints, { id: Date.now(), content: '', cost: 0 }]);
  };

  const removeHint = (hintId) => {
    setHints(hints.filter(hint => hint.id !== hintId));
  };

  const updateHint = (hintId, field, value) => {
    setHints(hints.map(hint => 
      hint.id === hintId ? { ...hint, [field]: value } : hint
    ));
  };

  const renderHints = () => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Hints</h3>
        <button
          type="button"
          onClick={addHint}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Hint
        </button>
      </div>
      
      <div className="space-y-4">
        {hints.map((hint, index) => (
          <div key={hint.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium text-gray-700">Hint {index + 1}</span>
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
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-gray-700">Content</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={hint.content}
                  onChange={(e) => updateHint(hint.id, 'content', e.target.value)}
                  placeholder="Enter hint content"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Cost</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={hint.cost}
                  onChange={(e) => updateHint(hint.id, 'cost', parseInt(e.target.value) || 0)}
                  placeholder="Points"
                  min="0"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStandardForm = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <div>
          <label className="block mb-2 font-medium">Name</label>
          <input
            type="text"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Enter challenge name"
            required
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">Category</label>
          <input
            type="text"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            placeholder="Enter challenge category"
            required
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">Description</label>
          <textarea
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            placeholder="Challenge description"
            rows={4}
            required
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">Value</label>
          <input
            type="number"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.value}
            onChange={(e) => setFormData({...formData, value: e.target.value})}
            placeholder="Enter point value"
            required
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">Flag</label>
          <input
            type="text"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.flag}
            onChange={(e) => setFormData({...formData, flag: e.target.value})}
            placeholder="Enter flag"
            required
          />
          <div className="mt-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.caseSensitive}
                onChange={(e) => setFormData({...formData, caseSensitive: e.target.checked})}
              />
              <span className="ml-2">Case Sensitive</span>
            </label>
          </div>
        </div>
        <div>
          <label className="block mb-2 font-medium">File Links</label>
          <div className="space-y-2">
            {formData.file_links?.map((link, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  className="flex-grow border rounded-lg px-4 py-2"
                  value={link}
                  onChange={(e) => {
                    const newLinks = [...(formData.file_links || [])];
                    newLinks[index] = e.target.value;
                    setFormData({...formData, file_links: newLinks});
                  }}
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
                file_links: [...(formData.file_links || []), '']
              })}
              className="px-4 py-2 bg-green-500 text-white rounded-lg"
            >
              Add File Link
            </button>
          </div>
        </div>
        <div>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={formData.isHidden}
              onChange={(e) => setFormData({...formData, isHidden: e.target.checked})}
            />
            <span className="ml-2">Hidden</span>
          </label>
        </div>
      </div>
      {renderHints()}
    </div>
  );

  const renderCodeForm = () => (
    <div className="space-y-6">
      {renderStandardForm()}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <div>
          <label className="block mb-2 font-medium">Programming Language</label>
          <select
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.language}
            onChange={(e) => setFormData({...formData, language: e.target.value})}
            required
          >
            <option value="">Select Language</option>
            {programmingLanguages.map(lang => (
              <option key={lang.name} value={lang.name}>{lang.name}</option>
            ))}
          </select>
        </div>
        {formData.language && (
          <div>
            <label className="block mb-2 font-medium">Version</label>
            <select
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.version}
              onChange={(e) => setFormData({...formData, version: e.target.value})}
              required
            >
              <option value="">Select Version</option>
              {programmingLanguages
                .find(lang => lang.name === formData.language)
                ?.versions.map(version => (
                  <option key={version} value={version}>{version}</option>
                ))
              }
            </select>
          </div>
        )}
      </div>
    </div>
  );

  const renderDynamicForm = () => (
    <div className="space-y-6">
      {renderStandardForm()}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <div>
          <label className="block mb-2 font-medium">Decay Function</label>
          <select
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.decayFunction}
            onChange={(e) => setFormData({...formData, decayFunction: e.target.value})}
            required
          >
            <option value="linear">Linear</option>
            <option value="logarithmic">Logarithmic</option>
          </select>
          <p className="text-sm text-gray-600 mt-1">
            {formData.decayFunction === 'linear' 
              ? 'Calculated as Initial - (Decay * SolveCount)'
              : 'Calculated as (((Minimum - Initial) / (Decay^2)) * (SolveCount^2)) + Initial'}
          </p>
        </div>
        <div>
          <label className="block mb-2 font-medium">Decay Value</label>
          <input
            type="number"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.decayValue}
            onChange={(e) => setFormData({...formData, decayValue: e.target.value})}
            placeholder="Enter decay value"
            required
          />
          <p className="text-sm text-gray-600 mt-1">
            {formData.decayFunction === 'linear'
              ? 'The amount of points deducted per solve. Equal deduction per solve.'
              : 'The amount of solves before the challenge reaches its minimum value.'}
          </p>
        </div>
        <div>
          <label className="block mb-2 font-medium">Minimum Value</label>
          <input
            type="number"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.minimumValue}
            onChange={(e) => setFormData({...formData, minimumValue: e.target.value})}
            placeholder="Enter minimum value"
            required
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-6">Create Challenge</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <label className="block mb-2 font-medium">Challenge Type</label>
          <div className="grid grid-cols-5 gap-2">
            {getChallengeTypes().map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`p-2 rounded-lg text-center ${
                  selectedType === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {selectedType === 'standard' && renderStandardForm()}
          {selectedType === 'code' && renderCodeForm()}
          {selectedType === 'dynamic' && renderDynamicForm()}
          {selectedType === 'manual_verification' && renderStandardForm()}
          {selectedType === 'multiple_choice' && renderStandardForm()}

          <div className="mt-6 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => navigate('/admin/challenges')}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Challenge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateChallenge; 