// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../../hooks/useAuth';
// import { getTeamProfile, addTeamMember } from '../../api/teams';

// function TeamProfile() {
//   const { user } = useAuth();
//   const [teamProfile, setTeamProfile] = useState(null);
//   const [newMemberName, setNewMemberName] = useState('');
//   const [newMemberEmail, setNewMemberEmail] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [showAddMemberModal, setShowAddMemberModal] = useState(false);

//   useEffect(() => {
//     const fetchTeamProfile = async () => {
//       try {
//         const profile = await getTeamProfile();
//         setTeamProfile(profile);
//       } catch (error) {
//         setError('Failed to fetch team profile');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchTeamProfile();
//   }, []);

//   const handleAddMember = async () => {
//     try {
//       const updatedProfile = await addTeamMember(newMemberName, newMemberEmail);
//       setTeamProfile(updatedProfile);
//       setNewMemberName('');
//       setNewMemberEmail('');
//       setShowAddMemberModal(false);
//     } catch (error) {
//       setError('Failed to add team member');
//     }
//   };

//   if (loading)
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
//       </div>
//     );

//   if (error)
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="text-red-500 text-xl font-semibold">{error}</div>
//       </div>
//     );

//   return (
//     <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
//       <h1 className="text-4xl font-bold mb-8 text-red-500">Team Profile</h1>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//         <div className="bg-[#FFF7ED] rounded-lg shadow-lg p-6">
//           <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Team Information</h2>
//           <p className="text-lg mb-2">
//             <strong>Team Name:</strong> {teamProfile.name} <strong>Points:</strong> {teamProfile.totalPoints}
//           </p>
//           <p className="text-lg mb-2">
//             <strong>Team Email:</strong> {teamProfile.email}
//           </p>
//           <p className="text-lg mb-4">
//             <strong>Members:</strong>
//           </p>
//           <table className="w-full bg-white">
//             <thead>
//               <tr className="bg-gray-100">
//                 <th className="px-4 py-2 text-left">Name</th>
//                 <th className="px-4 py-2 text-left">Email</th>
//               </tr>
//             </thead>
//             <tbody>
//               {teamProfile.members.map((member, index) => (
//                 <tr key={index} className="border-t">
//                   <td className="px-4 py-2">{member.name}</td>
//                   <td className="px-4 py-2">{member.email}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           <button
//             onClick={() => setShowAddMemberModal(true)}
//             className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
//           >
//             Add Member
//           </button>
//         </div>

//         <div className="bg-[#FFF7ED] rounded-lg shadow-lg p-6">
//           <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Team History of Submissions</h2>
//           <table className="w-full bg-white">
//             <thead>
//               <tr className="bg-gray-100">
//                 <th className="px-4 py-2 text-left">Challenge</th>
//                 <th className="px-4 py-2 text-left">Points</th>
//                 <th className="px-4 py-2 text-left">Solved At</th>
//               </tr>
//             </thead>
//             <tbody>
//               {teamProfile.submissions.map((submission, index) => (
//                 <tr key={index} className="border-t">
//                   <td className="px-4 py-2">{submission.challengeName}</td>
//                   <td className="px-4 py-2">{submission.points}</td>
//                   <td className="px-4 py-2">{submission.solvedAt}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {showAddMemberModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-6 rounded-lg w-96">
//             <h2 className="text-xl font-bold mb-4 text-neutral-900">Add Team Member</h2>
//             <input
//               type="text"
//               value={newMemberName}
//               onChange={(e) => setNewMemberName(e.target.value)}
//               placeholder="Enter member name"
//               className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//             <input
//               type="email"
//               value={newMemberEmail}
//               onChange={(e) => setNewMemberEmail(e.target.value)}
//               placeholder="Enter member email"
//               className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//             <div className="flex justify-end space-x-2">
//               <button
//                 onClick={() => setShowAddMemberModal(false)}
//                 className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleAddMember}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
//               >
//                 Add Member
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default TeamProfile;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getTeamProfile, addTeamMember } from '../../api/teams';
import LoadingSpinner from '../../components/LoadingSpinner';

function TeamProfile() {
  const { user } = useAuth();
  const [teamProfile, setTeamProfile] = useState({
    name: '',
    email: '',
    totalPoints: 0,
    members: [], // Initialize as empty array
    submissions: [] // Initialize as empty array
  });
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  useEffect(() => {
    const fetchTeamProfile = async () => {
      try {
        const profile = await getTeamProfile();
        setTeamProfile(profile || {
          name: '',
          email: '',
          totalPoints: 0,
          members: [],
          submissions: []
        });
      } catch (error) {
        setError('Failed to fetch team profile');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamProfile();
  }, []);

  const handleAddMember = async () => {
    try {
      await addTeamMember(newMemberName, newMemberEmail);
      const updatedProfile = await getTeamProfile();
      setTeamProfile(updatedProfile);
      setNewMemberName('');
      setNewMemberEmail('');
      setShowAddMemberModal(false);
    } catch (error) {
      setError('Failed to add team member');
    }
  };

  if (loading) {
    return <LoadingSpinner/>
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl font-bold mb-8 text-red-500">Team Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#FFF7ED] rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Team Information</h2>
          <p className="text-lg mb-2">
            <strong>Team Name:</strong> {teamProfile?.name}
          </p>
          <p className="text-lg mb-2">  
            <strong>Team Email:</strong> {teamProfile?.email}
          </p>
          <p className="text-lg mb-2">
            <strong>Total Points:</strong> {teamProfile?.totalPoints}
          </p>
          <p className="text-lg mb-4">
            <strong>Members:</strong>
          </p>
          <table className="w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
              </tr>
            </thead>
            <tbody>
              {teamProfile?.members?.map((member, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{member.name}</td>
                  <td className="px-4 py-2">{member.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Member
          </button>
        </div>

        <div className="bg-[#FFF7ED] rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Submission History</h2>
          <table className="w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Challenge</th>
                <th className="px-4 py-2 text-left">Points</th>
                <th className="px-4 py-2 text-left">Solved At</th>
              </tr>
            </thead>
            <tbody>
              {teamProfile?.submissions?.map((submission, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{submission.challengeName}</td>
                  <td className="px-4 py-2">{submission.points}</td>
                  <td className="px-4 py-2">{submission.solvedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4 text-neutral-900">Add Team Member</h2>
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="Enter member name"
              className="w-full px-4 py-2 mb-4 border rounded-lg"
            />
            <input
              type="email" 
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="Enter member email"
              className="w-full px-4 py-2 mb-4 border rounded-lg"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamProfile;

