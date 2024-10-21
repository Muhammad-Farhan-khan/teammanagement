'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2'; // SweetAlert2 for notifications
import { db, onAuthStateChanged, auth, collection, query, where, getDocs, storage, ref, uploadBytesResumable, getDownloadURL, addDoc } from '@/database/firebase-config'; // Ensure proper imports
import LoadingComponent from '@/components/LoadingComponent';

export default function CreateTeamForm() {
  const [loading, setLoading] = useState(true); 
  const [currentUser, setCurrentUser] = useState(null); // Store the current user
  const [users, setUsers] = useState([]); // All users
  const [filteredUsers, setFilteredUsers] = useState([]); // Non-admin users (team members)
  const [imageFile, setImageFile] = useState(null); // For image upload
  const [imageName, setImageName] = useState(''); // For displaying selected image name
  const router = useRouter(); // For navigation

  // Team form data
  const [teamData, setTeamData] = useState({
    teamName: '',
    teamDescription: '',
    teamLead: '', // Admin will be set as team lead
    teamType: '',
    members: [],
    numberOfMembers: 0,
    imageUrl: '', // Image URL after upload
  });

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTeamData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Fetch current authenticated user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login'); // Redirect to login page if not authenticated
      } else {
        setCurrentUser(user);
        setTeamData((prevData) => ({
          ...prevData,
          teamLead: user.email, // Set current user as team lead (admin)
        }));
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch users based on team type
  const fetchUsers = async (teamType) => {
    try {
      const usersRef = collection(db, 'users');
      let designationFilter;

      switch (teamType) {
        case 'Frontend':
          designationFilter = 'Frontend Developer';
          break;
        case 'Backend':
          designationFilter = 'Backend Developer';
          break;
        case 'UI/UX':
          designationFilter = 'UI/UX Designer';
          break;
        case 'Sales':
          designationFilter = 'Salesman';
          break;
        case 'Marketing':
          designationFilter = 'Marketer';
          break;
        case 'Full Stack':
          designationFilter = ['Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'UI/UX Designer'];
          break;
        default:
          designationFilter = '';
      }

      if (designationFilter) {
        const q = Array.isArray(designationFilter)
          ? query(usersRef, where('designation', 'in', designationFilter))
          : query(usersRef, where('designation', '==', designationFilter));

        const querySnapshot = await getDocs(q);
        const fetchedUsers = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(fetchedUsers)
        // Filter out the current user (admin) from the list
        const filtered = fetchedUsers.filter(user => user.email !== currentUser?.email);
        setFilteredUsers(filtered); // Set non-admin users for selection
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch users whenever the team type changes
  useEffect(() => {
    if (teamData.teamType && currentUser) {
      fetchUsers(teamData.teamType);
    }
  }, [teamData.teamType, currentUser]);

  // Handle adding members to the team
  const addMember = (e) => {
    const selectedUserId = e.target.value;
    const selectedUser = filteredUsers.find(user => user.id === selectedUserId);

    if (selectedUser && teamData.members.length < teamData.numberOfMembers) {
      setTeamData({
        ...teamData,
        members: [...teamData.members, selectedUser], // Add member to the list
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading

    try {
      let imageUrl = '';

      // Upload image to Firebase Storage if an image is selected
      if (imageFile) {
        const storageRef = ref(storage, `teamImages/${imageFile.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, imageFile);
        imageUrl = await getDownloadURL(uploadTask.ref); // Get the uploaded image URL
      }

      // Save team data to Firestore
      await addDoc(collection(db, 'teams'), {
        ...teamData,
        imageUrl, // Include the image URL in the team data
        teamLead: currentUser?.email, // Save current user as team lead/admin
      });

      Swal.fire({
        icon: 'success',
        title: 'Team created successfully!',
        showConfirmButton: false,
        timer: 2000
      });

      router.push('/teams'); // Redirect to the teams page
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error creating team',
        text: error.message,
      });
    } finally {
      setLoading(false); // End loading
      setTeamData({
        teamName: '',
        teamDescription: '',
        teamLead: '',
        teamType: '',
        members: [],
        numberOfMembers: 0,
        imageUrl: '',
      }); // Reset form data
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        {/* Loading spinner */}
        <LoadingComponent />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white shadow-lg rounded-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Create a New Team</h2>
      <form onSubmit={handleSubmit}>
        {/* Team Name */}
        <div className="mb-4">
          <label htmlFor="teamName" className="block text-gray-700">Team Name</label>
          <input
            type="text"
            name="teamName"
            id="teamName"
            value={teamData.teamName}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Enter team name"
          />
        </div>

        {/* Team Description */}
        <div className="mb-4">
          <label htmlFor="teamDescription" className="block text-gray-700">Team Description</label>
          <textarea
            name="teamDescription"
            id="teamDescription"
            value={teamData.teamDescription}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Enter team description"
          ></textarea>
        </div>

        {/* Team Lead (current user) */}
        <div className="mb-4">
          <label htmlFor="teamLead" className="block text-gray-700">Team Lead</label>
          <input
            type="text"
            name="teamLead"
            id="teamLead"
            value={
              users.filter((user) => user.email === teamData.teamLead)[0]?.username || ""
            }            disabled // Disable this field, it will always be the current user
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Team Type */}
        <div className="mb-4">
          <label htmlFor="teamType" className="block text-gray-700">Team Type</label>
          <select
            name="teamType"
            id="teamType"
            value={teamData.teamType}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">Select team type</option>
            <option value="Frontend">Frontend</option>
            <option value="Backend">Backend</option>
            <option value="UI/UX">UI/UX</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="Full Stack">Full Stack</option>
          </select>
        </div>

        {/* Number of Members */}
        <div className="mb-4">
          <label htmlFor="numberOfMembers" className="block text-gray-700">Number of Members</label>
          <input
            type="number"
            name="numberOfMembers"
            id="numberOfMembers"
            value={teamData.numberOfMembers}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Enter number of members"
          />
        </div>

        {/* Add Members */}
        <div className="mb-4">
          <label htmlFor="members" className="block text-gray-700">Add Members</label>
          <select
            name="members"
            id="members"
            onChange={addMember}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">Select member to add</option>
            {filteredUsers.map(user => (
              <option key={user.id} value={user.id}>{user.username} ({user.designation})</option>
            ))}
          </select>
        </div>

        {/* Image Upload */}
        <div className="mb-4">
          <label htmlFor="teamImage" className="block text-gray-700">Team Image</label>
          <input
            type="file"
            name="teamImage"
            id="teamImage"
            accept="image/*"
            onChange={(e) => {
              setImageFile(e.target.files[0]);
              setImageName(e.target.files[0]?.name || '');
            }}
            className="w-full px-4 py-2 border rounded-lg"
          />
          {imageName && <p className="text-sm text-gray-500 mt-1">{imageName}</p>}
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg"
            disabled={loading}
          >
            {loading ? 'Creating Team...' : 'Create Team'}
          </button>
        </div>
      </form>
    </div>
  );
}
