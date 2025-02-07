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
    file_links: []
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

      // Append form fields
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('category', formData.category);
      formDataToSend.append('flag', formData.flag.trim());
      formDataToSend.append('max_points', formData.max_points);
      formDataToSend.append('max_team_size', formData.max_team_size);
      formDataToSend.append('is_hidden', formData.is_hidden);

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
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
          <div>
            <label className="block mb-2 font-medium">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
              maxLength={200}
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
            <label className="block mb-2 font-medium">Docker Image (Optional)</label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept=".tar,.tar.gz"
                onChange={handleFileChange}
                className="w-full border rounded-lg px-4 py-2"
              />
              {dockerFileName && (
                <span className="text-sm text-gray-600">
                  Selected: {dockerFileName}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Upload .tar or .tar.gz file (optional)
            </p>
          </div>

          <div>
            <label className="block mb-2 font-medium">Flag</label>
            <input
              type="text"
              value={formData.flag}
              onChange={(e) => setFormData({...formData, flag: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Points</label>
            <input
              type="number"
              value={formData.max_points}
              onChange={(e) => setFormData({...formData, max_points: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
              min="0"
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
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Hint {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeHint(index)}
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
                        onChange={(e) => updateHint(index, 'content', e.target.value)}
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="Hint content"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={hint.cost}
                        onChange={(e) => updateHint(index, 'cost', parseInt(e.target.value))}
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
                onClick={addHint}
                className="px-4 py-2 bg-green-500 text-white rounded-lg"
              >
                Add Hint
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/challenges')}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Creating...' : 'Create Challenge'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateChallenge;