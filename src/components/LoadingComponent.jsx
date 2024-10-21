import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';

const LoadingComponent = () => {
  return (
    <div className="flex justify-center items-center h-screen w-screen bg-gray-100">
      <div className="flex flex-col items-center">
        <CircularProgress size={60} thickness={5} />
        <p className="mt-4 text-gray-500">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingComponent;
