import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createChallenge } from '../../api/challenges';

function CreateChallenge() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'web',
    docker_image: null,
    flag: '',
    max_points: '',
    max_team_size: 3,
    is_hidden: false,
    hints: [],
    file_links: [],
    ssh_user: '',
    port: '22'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dockerFileName, setDockerFileName] = useState('');
  
  const categoryOptions = [
    'web',
    'crypto',
    'pwn',
    'reverse',
    'forensics',
    'misc'
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setFormData({...formData, docker_image: null});
      setDockerFileName('');
      return;
    }

    if (!file.name.endsWith('.tar') && !file.name.endsWith('.tar.gz')) {
      setError('Only .tar and .tar.gz files are allowed');
      e.target.value = '';
      return;
    }

    setError('');
    setFormData({...formData, docker_image: file});
    setDockerFileName(file.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Validate required fields (removed docker_image validation)
      if (!formData.title.trim()) throw new Error('Title is required');
      if (!formData.description.trim()) throw new Error('Description is required');
      if (!formData.flag.trim()) throw new Error('Flag is required');
      if (!formData.max_points) throw new Error('Points are required');
      if (!formData.port) throw new Error('Port is required');

      // Append form fields
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('category', formData.category);
      formDataToSend.append('flag', formData.flag.trim());
      formDataToSend.append('max_points', formData.max_points);
      formDataToSend.append('max_team_size', formData.max_team_size);
      formDataToSend.append('is_hidden', formData.is_hidden);
      formDataToSend.append('port', formData.port);
      
      // Only append ssh_user if it's provided
      if (formData.ssh_user.trim()) {
        formDataToSend.append('ssh_user', formData.ssh_user.trim());
      }

      // Only append docker_image if one is selected
      if (formData.docker_image) {
        formDataToSend.append('docker_image', formData.docker_image);
      }

      formDataToSend.append('hints', JSON.stringify(formData.hints.map(hint => ({
        content: hint.content.trim(),
        cost: parseInt(hint.cost)
      }))));
      
      formDataToSend.append('file_links', JSON.stringify(
        formData.file_links.filter(link => link.trim() !== '')
      ));

      const response = await createChallenge(formDataToSend);
      navigate(`/admin/challenges/${response.challenge_id}`);
    } catch (error) {
      console.error('Error creating challenge:', error);
      setError(error.response?.data?.error || error.message || 'Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  const addHint = () => {
    setFormData({
      ...formData,
      hints: [...formData.hints, { content: '', cost: 0 }]
    });
  };

  const removeHint = (index) => {
    const newHints = formData.hints.filter((_, i) => i !== index);
    setFormData({...formData, hints: newHints});
  };

  const updateHint = (index, field, value) => {
    const newHints = [...formData.hints];
    newHints[index] = { ...newHints[index], [field]: value };
    setFormData({...formData, hints: newHints});
  };

  const addFileLink = () => {
    setFormData({
      ...formData,
      file_links: [...formData.file_links, '']
    });
  };

  const removeFileLink = (index) => {
    const newLinks = formData.file_links.filter((_, i) => i !== index);
    setFormData({...formData, file_links: newLinks});
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-red-500">Create Challenge</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#FFF7ED] p-8 rounded-lg shadow-sm space-y-6">
          <div>
            <label className="block mb-2 font-medium text-gray-900">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-900">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
            <label className="block mb-2 font-medium text-gray-900">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-900">Docker Image (Optional)</label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept=".tar,.tar.gz"
                onChange={handleFileChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
              {dockerFileName && (
                <span className="text-sm text-gray-900">
                  Selected: {dockerFileName}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-900 mt-1">
              Upload .tar or .tar.gz file (optional)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-medium text-gray-900">Port <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({...formData, port: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="22"
                required
              />
              <p className="text-sm text-gray-600 mt-1">Port number is required for all containers</p>
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-900">SSH User</label>
              <input
                type="text"
                value={formData.ssh_user}
                onChange={(e) => setFormData({...formData, ssh_user: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="atlas"
              />
              <p className="text-sm text-gray-600 mt-1">Optional: Required only for SSH-type containers</p>
            </div>
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-900">Flag</label>
            <input
              type="text"
              value={formData.flag}
              onChange={(e) => setFormData({...formData, flag: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-900">Points</label>
            <input
              type="number"
              value={formData.max_points}
              onChange={(e) => setFormData({...formData, max_points: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-900">Max Team Size</label>
            <input
              type="number"
              value={formData.max_team_size}
              onChange={(e) => setFormData({...formData, max_team_size: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
              min="1"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 text-gray-900">
              <input
                type="checkbox"
                checked={formData.is_hidden}
                onChange={(e) => setFormData({...formData, is_hidden: e.target.checked})}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="font-medium">Hidden Challenge</span>
            </label>
          </div>

          {/* Hints Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="font-medium text-gray-900">Hints</label>
              <button
                type="button"
                onClick={addHint}
                className="px-4 py-2 bg-red-500 border border-gray-300 rounded-lg hover:bg-red-600 transition-colors text-white"
              >
                Add Hint
              </button>
            </div>
            {formData.hints.map((hint, index) => (
              <div key={index} className="flex space-x-4">
                <input
                  type="text"
                  value={hint.content}
                  onChange={(e) => updateHint(index, 'content', e.target.value)}
                  placeholder="Hint content"
                  className="flex-grow border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
                <input
                  type="number"
                  value={hint.cost}
                  onChange={(e) => updateHint(index, 'cost', e.target.value)}
                  placeholder="Cost"
                  className="w-24 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => removeHint(index)}
                  className="px-4 py-2 bg-red-500 border border-gray-300 rounded-lg hover:bg-red-600 transition-colors text-white"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* File Links Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="font-medium text-gray-900">File Links</label>
              <button
                type="button"
                onClick={addFileLink}
                className="px-4 py-2 bg-red-500 border border-gray-300 rounded-lg hover:bg-red-600 transition-colors text-white"
              >
                Add File Link
              </button>
            </div>
            {formData.file_links.map((link, index) => (
              <div key={index} className="flex space-x-4">
                <input
                  type="text"
                  value={link}
                  onChange={(e) => {
                    const newLinks = [...formData.file_links];
                    newLinks[index] = e.target.value;
                    setFormData({...formData, file_links: newLinks});
                  }}
                  placeholder="File URL"
                  className="flex-grow border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
                <button
                  type="button"
                  onClick={() => removeFileLink(index)}
                  className="px-4 py-2 bg-red-500 border border-gray-300 rounded-lg hover:bg-red-600 transition-colors text-white"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/challenges')}
            className="px-4 py-2 bg-red-400 border border-gray-300 rounded-lg hover:bg-red-500 transition-colors text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {loading ? 'Creating...' : 'Create Challenge'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateChallenge;