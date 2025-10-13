import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase.js';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO.js';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Check your inbox for password reset instructions.');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <>
            <SEO 
                title="Reset Password | DCCC Shows"
                description="Reset your password for your Dhaka College Cultural Club account."
                noIndex 
            />
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="max-w-md w-full space-y-8 p-10 bg-gray-900/70 backdrop-blur-lg border border-gray-700 shadow-xl rounded-2xl">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-100">
                            Reset your password
                        </h2>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {error && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
                        {message && <p className="text-center text-green-400 bg-green-900/50 p-3 rounded-md">{message}</p>}
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <input id="email-address" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-700 bg-gray-800/50 placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Email address" />
                            </div>
                        </div>
                        <div>
                            <button type="submit" className="w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md transition-all duration-300 transform hover:scale-105">
                                Send Reset Link
                            </button>
                        </div>
                    </form>
                    <p className="text-center text-sm text-gray-400">
                        Remember your password?{' '}
                        <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export default ForgotPasswordPage;