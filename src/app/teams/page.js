'use client';
import React, { useEffect, useState } from 'react';
import { db, storage, auth, collection, getDownloadURL, getDocs, ref } from '@/database/firebase-config';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import { useRouter } from 'next/navigation';
import LoadingComponent from '@/components/LoadingComponent';

// Tailwind CSS for card and layout
const cardClass = 'bg-white rounded-lg shadow-lg overflow-hidden flex flex-col items-center p-6 mb-6 w-full max-w-lg mx-auto transition-transform transform hover:scale-105';
const avatarClass = 'w-20 h-20 rounded-full mx-auto mb-4';
const teamDetailsClass = 'text-center text-gray-800';
const buttonClass = 'bg-blue-600 text-white font-bold py-2 px-4 rounded-lg mt-6 transition-transform transform hover:scale-105 hover:bg-blue-700';
const sectionClass = 'mb-10 border-t pt-6';

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch teams data from Firestore
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'teams'));
        const teamsData = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const imageUrl = await getDownloadURL(ref(storage, data.imageUrl));
            return { id: doc.id, ...data, imageUrl };  // Include the doc.id
          })
        );
        setTeams(teamsData);
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setLoading(false); // Stop loading after data is fetched
      }
    };

    fetchTeams();
  }, []);

  const handleCreateTeam = () => {
    router.push('/createteams');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingComponent />
      </div>
    );
  }

  const currentUserEmail = auth.currentUser.email;

  // Filter teams into My Created Teams and Other Created Teams
  const myCreatedTeams = teams.filter(team => team.teamLead === currentUserEmail);
  const otherTeams = teams.filter(team => 
    team.teamLead !== currentUserEmail && 
    team.members.some(member => member.email === currentUserEmail)
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6 text-center">Teams</h1>

      {/* My Created Teams Section */}
      <div className={sectionClass}>
        <h2 className="text-2xl font-semibold mb-4">My Created Teams</h2>
        {myCreatedTeams.length === 0 ? (
          <div className="flex flex-col items-center">
            <p className="text-gray-600 mb-4">You have not created any teams yet.</p>
            <button className={buttonClass} onClick={handleCreateTeam}>
              Create Your Team
            </button>
          </div>
        ) : (
          myCreatedTeams.map((team, index) => (
            <div
              key={index}
              className={cardClass}
              onClick={() => router.push(`/teams/${team.id}`)} // Navigate to the team details page with the team ID
            >
              <img
                src={team.imageUrl}
                alt={team.teamName}
                className={avatarClass}
              />
              <div className={teamDetailsClass}>
                <h2 className="text-xl font-bold">{team.teamName}</h2>
                <p className="mt-2 text-gray-600">{team.description}</p>
              </div>
              <p className="mt-2 font-bold">Team Type: <span className="text-blue-500">{team.teamType}</span></p>
              <AvatarGroup max={4} className="mt-4">
                {team.members?.map((member, index) => (
                  <Avatar key={index} alt={member.username} src={member.imageUrl} />
                ))}
              </AvatarGroup>
            </div>
          ))
        )}
      </div>

      {/* Other Created Teams Section */}
      <div className={sectionClass}>
        <h2 className="text-2xl font-semibold mb-4">Other Created Teams</h2>
        {otherTeams.length === 0 ? (
          <p className="text-gray-600">You have not been added to any other teams.</p>
        ) : (
          otherTeams.map((team, index) => (
            <div
              key={index}
              className={cardClass}
              onClick={() => router.push(`/teams/${team.id}`)} // Navigate to the team details page with the team ID
            >
              <img
                src={team.imageUrl}
                alt={team.teamName}
                className={avatarClass}
              />
              <div className={teamDetailsClass}>
                <h2 className="text-xl font-bold">{team.teamName}</h2>
                <p className="mt-2 text-gray-600">{team.description}</p>
              </div>
              <p className="mt-2 font-bold">Team Type: <span className="text-blue-500">{team.teamType}</span></p>
              <AvatarGroup max={4} className="mt-4">
                {team.members?.map((member, index) => (
                  <Avatar key={index} alt={member.username} src={member.imageUrl} />
                ))}
              </AvatarGroup>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
