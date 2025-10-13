import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createUserProfile } from '../services/firebaseService.js';
import { useAuth } from '../contexts/AuthContext.js';
import SEO from '../components/SEO.js';

const CompleteSignUpPage: React.FC = () => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [batch, setBatch] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (location.state) {
            setName(location.state.name || '');
            setEmail(location.state.email || '');
        } else if (currentUser) {
            // Fallback if state is lost on refresh
            setName(currentUser.displayName || '');
            setEmail(currentUser.email || '');
        } else {
            // If no user and no state, something is wrong. Go back to signup.
            navigate('/signup');
        }
    }, [location.state, currentUser, navigate]);

    const handleCompleteSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone.trim() || !batch.trim()) {
            setError("Please fill in all required fields.");
            return;
        }
        if (phone.length !== 11 || !phone.startsWith('01')) {
            setError("Phone number must be 11 digits long and start with '01'.");
            return;
        }
        if (!currentUser) {
            setError("Authentication error. Please try signing up again.");
            return;
        }

        setError('');
        setLoading(true);
        try {
            await createUserProfile(currentUser.uid, name, email, phone, batch);
            navigate('/profile');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBatchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d{0,2}$/.test(value)) {
            setBatch(value);
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d{0,11}$/.test(value)) {
            setPhone(value);
        }
    };

    return (
        <>
            <SEO 
                title="Complete Your Profile | DCCC Shows"
                description="Just a few more details to complete your registration with the Dhaka College Cultural Club."
                noIndex 
            />
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="max-w-md w-full space-y-8 p-10 bg-gray-900/70 backdrop-blur-lg border border-gray-700 shadow-xl rounded-2xl">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-100">
                            Almost There!
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-400">
                            Please provide the remaining details to complete your profile.
                        </p>
                    </div>
                    <form className="space-y-4" onSubmit={handleCompleteSignUp}>
                        {error && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
                        <div className="rounded-md space-y-4">
                            <div>
                                <label htmlFor="name" className="sr-only">Full Name</label>
                                <input id="name" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800/50 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Full Name" />
                            </div>
                            <div>
                                <label htmlFor="email" className="sr-only">Email address</label>
                                <input id="email" name="email" type="email" value={email} disabled className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800/50 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm cursor-not-allowed" placeholder="Email address" />
                            </div>
                            <div>
                                <label htmlFor="phone" className="sr-only">Phone Number</label>
                                <input 
                                    id="phone" 
                                    name="phone" 
                                    type="tel" 
                                    value={phone} 
                                    onChange={handlePhoneChange} 
                                    maxLength={11} 
                                    required 
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800/50 placeholder-gray-500 text-gray-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                                    placeholder="Phone Number (e.g., 01712345678)"
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">HSC -</span>
                                <input id="batch" name="batch" type="tel" value={batch} onChange={handleBatchChange} maxLength={2} required className="pl-14 appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800/50 placeholder-gray-500 text-gray-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g., 27" />
                            </div>
                        </div>
                        <div>
                            <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed">
                                {loading ? 'Saving...' : 'Complete Sign Up'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default CompleteSignUpPage;