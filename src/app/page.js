'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, onAuthStateChanged, signOut } from "@/database/firebase-config";
import Swal from 'sweetalert2';
import LoadingComponent from "@/components/LoadingComponent";
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    await Swal.fire('Logged Out', 'You have been logged out successfully', 'success');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingComponent />
      </div>
    );
  }

  // Mouse hover animation handler (JavaScript version)
  const handleMouseMove = (e) => {
    const element = e.currentTarget;
    const { left, top, width, height } = element.getBoundingClientRect();
    const x = e.clientX - left - width / 2;
    const y = e.clientY - top - height / 2;

    element.style.transform = `perspective(1000px) rotateY(${x / 20}deg) rotateX(${-y / 20}deg)`;
  };

  const handleMouseLeave = (e) => {
    const element = e.currentTarget;
    element.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
  };

  return (
    <div className="flex flex-col  justify-center items-center h-screen bg-gradient-to-br from-purple-400 via-blue-500 to-pink-500 font-poppins">
      <div className="flex space-x-8">
        {/* Create New Team Card */}
        <Link href="/createteams" passHref>
          <div
            className="cursor-pointer max-w-xs w-full bg-white/10 backdrop-blur-md shadow-lg rounded-lg border border-white/10 hover:shadow-2xl transition-all duration-300 p-8 flex flex-col items-center text-center"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <h2 className="text-white text-2xl font-bold mb-4 poppins-light">Create New Team</h2>
          </div>
        </Link>

        {/* Your Existing Teams Card */}
        <Link href="/teams" passHref>
          <div
            className="cursor-pointer max-w-xs w-full bg-white/10 backdrop-blur-md shadow-lg rounded-lg border border-white/10 hover:shadow-2xl transition-all duration-300 p-8 flex flex-col items-center text-center"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <h2 className="text-white text-2xl font-bold mb-4 poppins-light">Your Existing Teams</h2>
          </div>
        </Link>
      </div>
      <button className="py-4 my-4 w-[570px] bg-black text-white rounded-lg " onClick={handleLogout}>Signout </button>
    </div>
  );
}
