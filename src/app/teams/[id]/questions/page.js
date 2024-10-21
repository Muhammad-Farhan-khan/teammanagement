'use client'
import React, { useState } from 'react';
import { db, collection, addDoc } from '@/database/firebase-config';
import { Button, TextField, Dialog } from '@mui/material';

const CreateQuestionDialog = ({ teamId, open, onClose }) => {
  const [questionText, setQuestionText] = useState('');

  const handleCreateQuestion = async () => {
    await addDoc(collection(db, 'questions'), {
      teamId: teamId,
      question: questionText,
      createdAt: new Date(),
      createdBy: 'admin',  // Assuming admin creates the question
    });
    onClose();  // Close the dialog after creating the question
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Create New Question</h2>
        <TextField
          label="Question"
          fullWidth
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          className="mt-4"
          onClick={handleCreateQuestion}
        >
          Add Question
        </Button>
      </div>
    </Dialog>
  );
};

export default CreateQuestionDialog;
