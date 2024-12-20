import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { submitFlag } from '../api/challenges';

function ChallengeCard({ challenge }) {
  const [flag, setFlag] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!flag.trim()) return;

    setSubmitting(true);
    try {
      const result = await submitFlag(challenge.id, flag, user.token);
      setMessage(result.message);
      setFlag('');
      if (result.success) {
        // You might want to trigger a refresh of challenges or scores here
      }
    } catch (error) {
      setMessage('Error submitting flag. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="challenge-card bg-white shadow-md rounded-lg p-6 mb-4">
      <h3 className="text-xl font-semibold mb-2">{challenge.name}</h3>
      <p className="text-gray-600 mb-4">{challenge.description}</p>
      <p className="text-blue-600 font-bold mb-4">Points: {challenge.points}</p>
      <form onSubmit={handleSubmit} className="mt-4">
        <input
          type="text"
          value={flag}
          onChange={(e) => setFlag(e.target.value)}
          placeholder="Enter flag"
          className="input mb-2"
          disabled={submitting}
        />
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Flag'}
        </button>
      </form>
      {message && (
        <p
          className={`mt-2 text-sm ${
            message.includes('Error') ? 'text-red-500' : 'text-green-500'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export default ChallengeCard;
