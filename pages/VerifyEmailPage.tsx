import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { resendVerificationEmail, logout } from '../services/firebaseService';

const VerifyEmailPage: React.FC = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || currentUser?.email;

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (!currentUser) {
        setError('You must be logged in to resend a verification email. Please log in again.');
        return;
      }
      await resendVerificationEmail();
      setMessage('A new verification email has been sent. Please check your inbox and spam folder.');
    } catch (err) {
      setError('Failed to resend email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-gray-900/70 backdrop-blur-lg border border-gray-700 shadow-xl rounded-2xl text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-100">
          Verify Your Email
        </h2>
        {error && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
        {message && <p className="text-center text-green-400 bg-green-900/50 p-3 rounded-md">{message}</p>}
        <p className="text-gray-300">
          A verification link has been sent to <span className="font-bold text-blue-400">{email}</span>. Please check your inbox (and spam folder!) and click the link to activate your account.
        </p>
        <p className="text-gray-400 text-sm">
          You must verify your email before you can access your profile and other content.
        </p>
        <div className="mt-6 space-y-4">
          <button onClick={handleResend} disabled={loading} className="w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50">
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </button>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-200 text-sm">
            Logout and go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;