import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../api/config';
import LoadingSpinner from '../../components/LoadingSpinner';

function AdminTheme() {
  const { themeConfig, refreshTheme, themeLoading } = useTheme();
  const [formData, setFormData] = useState({
    site_name: '',
    primary_color: '#000000',
    secondary_color: '#1f2937',
    accent_color: '#FB3E3C',
    font_family: 'ui-sans-serif, system-ui',
    custom_css: '',
    logo: null,
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (themeConfig) {
      setFormData({
        site_name: themeConfig.site_name || '',
        primary_color: themeConfig.primary_color || '#000000',
        secondary_color: themeConfig.secondary_color || '#1f2937',
        accent_color: themeConfig.accent_color || '#FB3E3C',
        font_family: themeConfig.font_family || 'ui-sans-serif, system-ui',
        custom_css: themeConfig.custom_css || '',
        logo: null,
      });
      setLogoPreview(themeConfig.logo);
    }
  }, [themeConfig]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
      if (name === 'logo') {
        setLogoPreview(URL.createObjectURL(files[0]));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null) {
        data.append(key, formData[key]);
      }
    });

    try {
      await apiClient.put('/api/theme/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess('Theme updated successfully!');
      await refreshTheme();
    } catch (err) {
      setError('Failed to update theme.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (themeLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-red-500 mb-6">Theme Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-[#FFF7ED] p-8 rounded-lg shadow-sm">
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">{success}</div>}

        <div>
          <label className="block mb-2 font-medium text-gray-900">Site Name</label>
          <input
            type="text"
            name="site_name"
            value={formData.site_name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-900">Logo</label>
          <input
            type="file"
            name="logo"
            onChange={handleFileChange}
            className="w-full text-gray-900"
          />
          {logoPreview && <img src={logoPreview} alt="Logo Preview" className="mt-4 h-16 w-auto" />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block mb-2 font-medium text-gray-900">Primary Color</label>
            <input
              type="color"
              name="primary_color"
              value={formData.primary_color}
              onChange={handleChange}
              className="w-full h-12"
            />
          </div>
          <div>
            <label className="block mb-2 font-medium text-gray-900">Secondary Color</label>
            <input
              type="color"
              name="secondary_color"
              value={formData.secondary_color}
              onChange={handleChange}
              className="w-full h-12"
            />
          </div>
          <div>
            <label className="block mb-2 font-medium text-gray-900">Accent Color</label>
            <input
              type="color"
              name="accent_color"
              value={formData.accent_color}
              onChange={handleChange}
              className="w-full h-12"
            />
          </div>
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-900">Font Family</label>
          <input
            type="text"
            name="font_family"
            value={formData.font_family}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder="e.g., 'Roboto', sans-serif"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-900">Custom CSS</label>
          <textarea
            name="custom_css"
            value={formData.custom_css}
            onChange={handleChange}
            rows="10"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white font-mono"
            placeholder="e.g., body { font-size: 16px; }"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminTheme;