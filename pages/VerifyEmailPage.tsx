import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { resendVerificationEmail, logout } from '../services/firebaseService.js';
import SEO from '../components/SEO.js';

const VerifyEmailPage: React.FC = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || currentUser?.email;

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleResend = async () => {
    setError('');
    setMessage('');
    setResendLoading(true);
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
      setResendLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    if (currentUser) {
      await currentUser.reload();
      if (currentUser.emailVerified) {
        navigate('/profile');
      } else {
        setError("Email still not verified. Please check your inbox (and spam folder!) and click the link.");
      }
    } else {
      setError("You seem to be logged out. Please log in again.");
    }
    setLoading(false);
  };


  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <SEO 
        title="Verify Your Email | DCCC Shows"
        description="Please verify your email address to complete your registration with the Dhaka College Cultural Club."
        noIndex
      />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
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
            Once you have verified, click the button below to continue.
          </p>
          <div className="mt-6 space-y-4">
            <button onClick={handleCheckVerification} disabled={loading} className="w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50">
              {loading ? 'Checking...' : "I've Verified My Email"}
            </button>
            <button onClick={handleResend} disabled={resendLoading} className="w-full flex justify-center py-2 px-4 text-sm font-medium rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50">
              {resendLoading ? 'Sending...' : 'Resend Verification Email'}
            </button>
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-200 text-sm pt-2">
              Logout and go to Login
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default VerifyEmailPage;