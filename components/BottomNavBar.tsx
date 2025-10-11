import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';

const BottomNavBar: React.FC = () => {
    const { currentUser } = useAuth();
    if (!currentUser) return null;

    const activeLinkClass = 'text-blue-400';
    const inactiveLinkClass = 'text-gray-400 hover:text-blue-400';
    const linkClasses = ({ isActive }: { isActive: boolean }) => 
        `${isActive ? activeLinkClass : inactiveLinkClass} flex flex-col items-center justify-center transition-colors w-1/5`;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-lg border-t border-gray-700 z-50">
            <div className="flex justify-around items-center h-16">
                <NavLink to="/" className={linkClasses}>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    <span className="text-xs font-medium">Home</span>
                </NavLink>

                <NavLink to="/shows" className={linkClasses}>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    <span className="text-xs font-medium">Shows</span>
                </NavLink>

                <NavLink to="/create" className="w-1/5 flex justify-center">
                    <div className="flex flex-col items-center justify-center -mt-8" aria-label="Create Post">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg transform hover:scale-110 transition-transform">
                            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        </div>
                    </div>
                </NavLink>

                <NavLink to="/leaderboard" className={linkClasses}>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    <span className="text-xs font-medium">Ranks</span>
                </NavLink>

                <NavLink to="/profile" className={linkClasses}>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span className="text-xs font-medium">Profile</span>
                </NavLink>
            </div>
        </nav>
    );
};
export default BottomNavBar;