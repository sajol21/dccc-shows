import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../config/firebase.js';
import { createUserProfile, signInWithGoogle } from '../services/firebaseService.js';

const SignUpPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [batch, setBatch] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const allowedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
    const emailDomain = email.split('@')[1];

    if (!emailDomain || !allowedDomains.includes(emailDomain.toLowerCase())) {
      setError('Sorry, only emails from major providers (e.g., Gmail, Yahoo, Outlook) are currently accepted.');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(userCredential.user.uid, name, email, phone, batch);
      await sendEmailVerification(userCredential.user);
      await auth.signOut(); // Log out the user until they verify
      navigate('/verify-email', { state: { email: email } });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      navigate('/profile');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-gray-900/70 backdrop-blur-lg border border-gray-700 shadow-xl rounded-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-100">
            Step into the Spotlight
          </h2>
        </div>
        
        <div className="mt-4">
           <button onClick={handleGoogleSignUp} disabled={loading} className="group relative w-full flex justify-center items-center py-2.5 px-4 border border-gray-600 text-sm font-medium rounded-lg text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              <svg className="w-5 h-5 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 24.5 172.1 64.2l-77.5 77.5C327.2 112.4 290.5 96 248 96c-88.8 0-160.1 71.3-160.1 160s71.3 160 160.1 160c98.1 0 142.4-66.2 147.1-101.4H248v-96h239.1c1.2 12.8 1.9 26.6 1.9 40.8z"></path></svg>
              Sign up with Google
            </button>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="flex-shrink mx-4 text-gray-500">OR</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>

        <form className="space-y-4" onSubmit={handleSignUp}>
          {error && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
          <div className="rounded-md space-y-4">
              <input name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800/50 placeholder-gray-500 text-gray-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Full Name" />
              <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800/50 placeholder-gray-500 text-gray-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Email address" />
              <input name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800/50 placeholder-gray-500 text-gray-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Phone Number" />
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">HSC -</span>
                <input name="batch" type="text" value={batch} onChange={(e) => setBatch(e.target.value)} required className="pl-14 appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800/50 placeholder-gray-500 text-gray-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g., 27" />
              </div>
              <input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800/50 placeholder-gray-500 text-gray-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Password" />
              <input name="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800/50 placeholder-gray-500 text-gray-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Confirm Password" />
          </div>
          <div>
            <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed">
              {loading ? 'Creating Account...' : 'Sign up'}
            </button>
          </div>
        </form>
         <p className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300">
                Sign in
            </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;