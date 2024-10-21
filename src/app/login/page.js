"use client"; // Add this to enable client-side rendering

import React, { useState, useEffect } from "react";
import { auth, signInWithEmailAndPassword, onAuthStateChanged } from "@/database/firebase-config";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import * as yup from "yup";
import { useFormik } from "formik";
import '../login/login.css'
import LoadingComponent from "@/components/LoadingComponent";
const SignInPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/");
      }
      else{
        setLoading(false)
      }
    });

    return () => unsubscribe();
  }, [router]);

  const validationSchema = yup.object().shape({
    email: yup.string().email("Invalid email address").required("Email is required"),
    password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema,
    onSubmit: (values) => {
      handleSignIn(values.email, values.password);
    },
  });

  const handleSignIn = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      setLoading(false);
      Swal.fire({
        title: "Signed in successfully!",
        text: `Welcome back, ${email}`,
        icon: "success",
        confirmButtonText: "Okay",
      });

      router.push("/"); // Redirect to the home page or dashboard
    } catch (error) {
      setLoading(false);
      Swal.fire({
        title: "Sign in failed!",
        text: error.message,
        icon: "error",
        confirmButtonText: "Okay",
      });
    }
  };

  const handleSignUpRedirect = () => {
    router.push("/signup"); // Navigate to the Sign Up page
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
    <div className="login-container">
      <div className="form-wrapper">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-700">Sign In</h1>

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="grid w-full items-center gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-gray-600">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`input-field ${formik.touched.email && formik.errors.email ? "border-red-500" : "border-gray-300"}`}
              placeholder="Enter your email"
            />
            {formik.touched.email && formik.errors.email && (
              <div className="error-message">{formik.errors.email}</div>
            )}
          </div>

          {/* Password Field */}
          <div className="grid w-full items-center gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-gray-600">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`input-field ${formik.touched.password && formik.errors.password ? "border-red-500" : "border-gray-300"}`}
              placeholder="Enter your password"
            />
            {formik.touched.password && formik.errors.password && (
              <div className="error-message">{formik.errors.password}</div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            {loading ? (
              <div className="text-blue-500 font-medium">Loading...</div>
            ) : (
              <button
                type="submit"
                className="signup-button"
              >
                Sign In
              </button>
            )}
          </div>
        </form>

        {/* Sign Up Redirect */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Create new account?{" "}
            <span
              onClick={handleSignUpRedirect}
              className="text-blue-500 hover:underline cursor-pointer"
            >
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
