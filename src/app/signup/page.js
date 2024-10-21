"use client";
import React, { useState, useEffect } from 'react';
import {
    auth,
    createUserWithEmailAndPassword,
    db,
    addDoc,
    collection,
    storage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
    onAuthStateChanged
} from '@/database/firebase-config';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as yup from 'yup';
import '../signup/signup.css'
import LoadingComponent from '@/components/LoadingComponent'
const SignUpPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push('/'); // Redirect to dashboard or any other page
            } else {
                setLoading(false); // Authentication check done, hide loading
            }
        });

        return () => unsubscribe();
    }, [router]);

    const validationSchema = yup.object().shape({
        username: yup.string().min(3, 'Username must be at least 3 characters').required('Username is required'),
        email: yup.string().email('Invalid email format').required('Email is required'),
        password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
        contact: yup.string().matches(/^[0-9]{1,15}$/, 'Contact number must be up to 15 digits').required('Contact number is required'),
        designation: yup.string().required('Designation is required'),
        image: yup
            .mixed()
            .test('fileSize', 'File size too large', (value) => {
                return value === null || (value && value.size <= 1024 * 1024); // 1MB max size
            })
    });

    const formik = useFormik({
        initialValues: {
            username: '',
            email: '',
            password: '',
            contact: '',
            designation: '',
            image: null
        },
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            setLoading(true);
            const { username, email, password, contact, designation, image } = values;

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                let imageUrl = '';

                if (image) {
                    const storageRef = ref(storage, `images/${user.uid}/${image.name}`);
                    const uploadTask = uploadBytesResumable(storageRef, image);

                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            console.log(`Upload is ${progress}% done`);
                        },
                        (error) => {
                            console.error("Error uploading image: ", error);
                            Swal.fire({
                                title: 'Image Upload Error',
                                text: error.message,
                                icon: 'error',
                                confirmButtonText: 'Okay'
                            });
                            setLoading(false);
                        },
                        async () => {
                            imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
                            await addUserToDB(user, username, email, contact, designation, imageUrl);
                        }
                    );
                } else {
                    await addUserToDB(user, username, email, contact, designation);
                }

            } catch (error) {
                Swal.fire({
                    title: 'Sign up failed!',
                    text: error.message,
                    icon: 'error',
                    confirmButtonText: 'Okay'
                });
                setLoading(false);
            }
        }
    });

    const addUserToDB = async (user, username, email, contact, designation, imageUrl = '') => {
        try {
            await addDoc(collection(db, "users"), {
                username,
                email,
                contact,
                designation,
                userId: user.uid,
                imageUrl
            });

            setLoading(false);
            Swal.fire({
                title: 'Sign up successfully!',
                text: email,
                icon: 'success',
                confirmButtonText: 'Okay'
            });
            router.push("/login");
        } catch (error) {
            console.error("Error adding document: ", error);
            setLoading(false);
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
        <div className="signup-container">
            <div className="form-wrapper">
                <h1 className='text-2xl font-bold mb-6 text-center text-gray-700'>Sign Up</h1>

                <form onSubmit={formik.handleSubmit} className="space-y-6">
                    {/* Username Field */}
                    <div className="grid w-full items-center gap-1.5">
                        <label htmlFor="username" className="text-sm font-medium text-gray-600">Username</label>
                        <input 
                            id="username"
                            type="text"
                            value={formik.values.username}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="input-field"
                            placeholder="Enter your username"
                        />
                        {formik.touched.username && formik.errors.username ? (
                            <div className="error-message">{formik.errors.username}</div>
                        ) : null}
                    </div>

                    {/* Email Field */}
                    <div className="grid w-full items-center gap-1.5">
                        <label htmlFor="email" className="text-sm font-medium text-gray-600">Email</label>
                        <input 
                            id="email"
                            type="email"
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="input-field"
                            placeholder="Enter your email"
                        />
                        {formik.touched.email && formik.errors.email ? (
                            <div className="error-message">{formik.errors.email}</div>
                        ) : null}
                    </div>

                    {/* Contact Number Field */}
                    <div className="grid w-full items-center gap-1.5">
                        <label htmlFor="contact" className="text-sm font-medium text-gray-600">Contact Number</label>
                        <input 
                            id="contact"
                            type="text"
                            value={formik.values.contact}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="input-field"
                            placeholder="Enter your contact number"
                        />
                        {formik.touched.contact && formik.errors.contact ? (
                            <div className="error-message">{formik.errors.contact}</div>
                        ) : null}
                    </div>

                    {/* Designation Field */}
                    <div className="grid w-full items-center gap-1.5">
                        <label htmlFor="designation" className="text-sm font-medium text-gray-600">Designation</label>
                        <select
                            id="designation"
                            value={formik.values.designation}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="input-field"
                        >
                            <option value="" label="Select designation" />
                            <option value="Frontend Developer" label="Frontend Developer" />
                            <option value="Backend Developer" label="Backend Developer" />
                            <option value="Full Stack Developer" label="Full Stack Developer" />
                            <option value="UI/UX Designer" label="UI/UX Designer" />
                            <option value="Salesman" label="Salesman" />
                            <option value="Marketer" label="Marketer" />
                        </select>
                        {formik.touched.designation && formik.errors.designation ? (
                            <div className="error-message">{formik.errors.designation}</div>
                        ) : null}
                    </div>

                    {/* Password Field */}
                    <div className="grid w-full items-center gap-1.5">
                        <label htmlFor="password" className="text-sm font-medium text-gray-600">Password</label>
                        <input 
                            id="password"
                            type="password"
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="input-field"
                            placeholder="Enter your password"
                        />
                        {formik.touched.password && formik.errors.password ? (
                            <div className="error-message">{formik.errors.password}</div>
                        ) : null}
                    </div>

                    {/* Image Upload Field */}
                    <div className="grid w-full items-center gap-1.5">
                        <label htmlFor="image" className="text-sm font-medium text-gray-600">Upload Image</label>
                        <input 
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                                formik.setFieldValue("image", event.currentTarget.files[0]);
                            }}
                            className="input-field"
                        />
                        {formik.touched.image && formik.errors.image ? (
                            <div className="error-message">{formik.errors.image}</div>
                        ) : null}
                    </div>

                    <button 
                        type="submit" 
                        className="signup-button" 
                        disabled={loading}
                    >
                        {loading ? 'Signing up...' : 'Sign Up'}
                    </button>
                </form>
                {/* LOGIN Redirect */}
                    <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Already have an account?{" "}
                        <span
                        onClick={() => router.push('/login')}
                        className="text-blue-500 hover:underline cursor-pointer"
                        >
                        Login
                        </span>
                    </p>
                    </div>
            </div>
        </div>
    );
};

export default SignUpPage;
