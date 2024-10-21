'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation'; // For dynamic route params
import { db, getDoc, doc, updateDoc, arrayUnion, setDoc, collection, query, getDocs } from '@/database/firebase-config'; // Ensure firebase functions are included
import Avatar from '@mui/material/Avatar';
import { Button, Dialog, TextField, Select, MenuItem, FormControl, InputLabel, Accordion, AccordionSummary, AccordionDetails, Divider } from '@mui/material';
import { getAuth } from 'firebase/auth';
import LoadingComponent from '@/components/LoadingComponent';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Import ExpandMore icon

const TeamPage = () => {
  const { id } = useParams(); // Get team ID from the URL
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [questions, setQuestions] = useState([]); // List of questions
  const [allUsers, setAllUsers] = useState([]); // All users available
  const [selectedUser, setSelectedUser] = useState(''); // Selected user from dropdown
  const [currentUser, setCurrentUser] = useState(null); // To hold current user info
  const [answers, setAnswers] = useState({}); // Store answers for each question

  useEffect(() => {
    const fetchTeam = async () => {
      const teamDoc = await getDoc(doc(db, 'teams', id)); // Fetch team data
      if (teamDoc.exists()) {
        setTeam(teamDoc.data());
      }
      setLoading(false);
    };

    const fetchAllUsers = async () => {
      const usersQuery = query(collection(db, 'users')); // Fetch all users
      const querySnapshot = await getDocs(usersQuery);
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      setAllUsers(users);

      // Fetch current user from Firebase Auth and match with users
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const matchedUser = users.find(u => u.email === user.email);
        if (matchedUser) {
          setCurrentUser(matchedUser);
        }
      }
    };

    const fetchQuestions = async () => {
      const questionsQuery = query(collection(db, 'teams', id, 'questions'));
      const questionsSnapshot = await getDocs(questionsQuery);
      const fetchedQuestions = [];
      questionsSnapshot.forEach((doc) => {
        fetchedQuestions.push({ id: doc.id, ...doc.data() });
      });
      setQuestions(fetchedQuestions);
    };

    fetchTeam();
    fetchAllUsers();
    fetchQuestions();
  }, [id]);

  const handleAddMember = () => {
    setIsAddMemberDialogOpen(true);
  };

  const handleAddSelectedMember = async () => {
    if (selectedUser && !team.members.find(member => member.id === selectedUser.id)) {
      await updateDoc(doc(db, 'teams', id), {
        members: arrayUnion({
          id: selectedUser.id,
          username: selectedUser.username,
          imageUrl: selectedUser.imageUrl
        })
      });
      setTeam((prevTeam) => ({
        ...prevTeam,
        members: [...prevTeam.members, { id: selectedUser.id, username: selectedUser.username, imageUrl: selectedUser.imageUrl }]
      }));
    }
    setIsAddMemberDialogOpen(false);
    setSelectedUser(''); // Reset selected user
  };

  const handleCreateQuestions = () => {
    setIsDialogOpen(true);
  };

  const handleSubmitQuestion = async () => {
    if (question) {
      await setDoc(doc(collection(db, 'teams', id, 'questions')), {
        question,
        createdAt: new Date()
      });
      setQuestions([...questions, { question, createdAt: new Date() }]);
      setIsDialogOpen(false);
      setQuestion(''); // Reset question input
    }
  };
  console.log(questions)
  const handleSubmitAnswer = async (questionId) => {
    const answer = answers[questionId];
    if (answer) {
      await setDoc(doc(collection(db, 'teams', id, 'questions', questionId, 'answers')), {
        answer,
        submittedBy: currentUser.email,
        createdAt: new Date()
      });
      setAnswers((prev) => ({ ...prev, [questionId]: '' })); // Reset the answer input after submission
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingComponent />
      </div>
    );
  }

  const isTeamLead = currentUser?.email === team.teamLead;

  const availableUsers = allUsers.filter(user =>
    user.id !== currentUser?.id && !team.members.some(member => member.id === user.id)
  );

  return (
    <div className="container mx-auto p-6">
      {/* Full-Width Banner */}
      <div className="w-full h-52 bg-blue-500 mb-6"></div>

      {/* Buttons for Add Member and Create Question (Visible only for team lead) */}
      {isTeamLead && (
        <div className="flex gap-4 mb-6">
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddMember}
            disabled={team.members.length >= team.numberOfMembers} // Disable if team is full
          >
            Add Member
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleCreateQuestions}
          >
            Create Question
          </Button>
        </div>
      )}

      {/* Display Team Leader */}
      <div className="mt-6">
        <h1 className="text-2xl font-bold mb-4">Team Leader</h1>
        {currentUser && (
          <div className="flex flex-col items-center bg-white shadow-md p-4 rounded-lg w-48">
            <Avatar src={currentUser.imageUrl} alt={currentUser.username} className="w-20 h-20 mb-2" />
            <p className="text-center font-semibold">{currentUser.username}</p>
          </div>
        )}
      </div>

      {/* Display Other Members */}
      <div className="my-6">
        <h1 className="text-2xl font-bold mb-4">Team Members</h1>
        <div className="flex flex-wrap gap-6">
          {team.members.map((member, index) => (
            <div
              key={index}
              className="flex flex-col items-center bg-white shadow-md p-4 rounded-lg w-48"
            >
              <Avatar src={member.imageUrl} alt={member.username} className="w-20 h-20 mb-2" />
              <p className="text-center font-semibold">{member.username}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Display Questions in a Single Accordion */}
      <div className="mt-6">
        <h1 className="text-2xl font-bold mb-4">Daily Questions</h1>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <p>Questions</p>
          </AccordionSummary>
          <AccordionDetails className="flex flex-col gap-4">
            {questions.map((q, idx) => {
              // Convert Firestore timestamp to JavaScript Date object
              const createdAt = new Date(q.createdAt.seconds * 1000); // Multiply by 1000 to convert to milliseconds
              const formattedDate = createdAt.toLocaleDateString(); // Format the date

              return (
                <div key={idx}>
                  <div className='flex justify-between'> 
                    <p>{q.question}</p>
                    <p>{formattedDate}</p> {/* Display the formatted date */}
                  </div>
                  {/* Show answer input only if current user is not the team lead */}
                  {!isTeamLead && (
                    <div className="mt-2">
                      <TextField
                        fullWidth
                        label="Your Answer"
                        variant="outlined"
                        value={answers[q.id] || ''}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleSubmitAnswer(q.id)}
                        className="mt-2"
                      >
                        Submit Answer
                      </Button>
                    </div>
                  )}
                  <Divider className="my-2" />
                </div>
              );
            })}
          </AccordionDetails>
        </Accordion>

      </div>

      {/* Dialog for Creating Questions */}
      <Dialog open={isDialogOpen} fullWidth maxWidth="md" onClose={() => setIsDialogOpen(false)}>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Create Question</h2>
          <TextField
            fullWidth
            label="Enter Question"
            variant="outlined"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div className="mt-4 flex justify-end">
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitQuestion}
            >
              Submit
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Dialog for Adding Members */}
      <Dialog open={isAddMemberDialogOpen} fullWidth maxWidth="md" onClose={() => setIsAddMemberDialogOpen(false)}>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Add Member to Team</h2>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Select User</InputLabel>
            <Select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              {availableUsers.map((user) => (
                <MenuItem key={user.id} value={user}>
                  {user.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <div className="mt-4 flex justify-end">
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddSelectedMember}
            >
              Add
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default TeamPage;
