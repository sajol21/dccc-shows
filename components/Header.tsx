import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { logout, getAnnouncements, markAnnouncementsAsRead } from '../services/firebaseService';
import { UserRole } from '../constants';
import { useTheme } from '../hooks/useTheme';
import { Announcement } from '../types';

const Header: React.FC = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAnnouncementsOpen, setAnnouncementsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userProfile) {
      const fetchAnnouncements = async () => {
        const allAnnouncements = await getAnnouncements();
        setAnnouncements(allAnnouncements);
        const newUnreadCount = allAnnouncements.filter(a => !userProfile.readAnnouncements.includes(a.id)).length;
        setUnreadCount(newUnreadCount);

        // Browser notification for new announcements
        if (newUnreadCount > 0 && Notification.permission === 'granted') {
           const latestUnread = allAnnouncements.filter(a => !userProfile.readAnnouncements.includes(a.id))[0];
           new Notification(latestUnread.title, {
               body: latestUnread.body,
               icon: '/vite.svg'
           });
        }
      };
      fetchAnnouncements();
    }
  }, [userProfile, loading]);

  const requestNotificationPermission = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
      }
  };
  
  useEffect(() => {
    // Ask for permission shortly after user is identified
    if(currentUser) {
        setTimeout(requestNotificationPermission, 5000);
    }
  }, [currentUser]);


  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };
  
  const handleAnnouncementsOpen = async () => {
      setAnnouncementsOpen(true);
      if (userProfile && unreadCount > 0) {
          const unreadIds = announcements.filter(a => !userProfile.readAnnouncements.includes(a.id)).map(a => a.id);
          await markAnnouncementsAsRead(userProfile.uid, unreadIds);
          setUnreadCount(0);
      }
  }

  const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
    <Link to={to} onClick={() => setMobileMenuOpen(false)} className="w-full lg:w-auto text-center lg:text-left text-lg lg:text-base font-medium text-gray-200 hover:text-white transition-colors duration-300 py-4 lg:py-2 px-6 lg:px-3">
      {children}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-white/10 dark:bg-black/20 backdrop-blur-lg border-b border-white/20 dark:border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <Link to="/" className="flex-shrink-0">
          <img src="https://res.cloudinary.com/dabfeqgsj/image/upload/v1759778648/cyizstrjgcq0w9fr8cxp.png" alt="DCCC Logo" className="h-10 w-auto" />
        </Link>
        
        <div className="block lg:hidden">
          <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-200 focus:outline-none">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
        
        <nav className={`fixed lg:relative top-0 right-0 h-full lg:h-auto w-64 lg:w-auto bg-white/80 dark:bg-[#161b22]/90 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none transition-transform duration-300 ease-in-out transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 flex flex-col lg:flex-row items-center pt-20 lg:pt-0 shadow-lg lg:shadow-none`}>
          <div className="absolute top-5 right-5 lg:hidden">
            <button onClick={() => setMobileMenuOpen(false)} className="text-gray-600 dark:text-gray-300 focus:outline-none">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="w-full flex flex-col lg:flex-row lg:items-center lg:space-x-2 text-gray-800 dark:text-gray-200">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/shows">Shows</NavLink>
            <NavLink to="/leaderboard">Leaderboard</NavLink>
            <NavLink to="/about">About</NavLink>
            {userProfile?.role === UserRole.ADMIN && <NavLink to="/admin">Admin</NavLink>}
          </div>
          
          <div className="w-full lg:w-auto mt-auto lg:mt-0 p-6 lg:p-0 lg:ml-4 flex items-center justify-center gap-2">
             <button onClick={toggleTheme} className="p-2 rounded-full text-gray-300 hover:bg-white/20 dark:hover:bg-gray-700 transition-colors">
                {theme === 'light' ? 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg> : 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 15.464A1 1 0 106.465 14.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm-2.121-2.121a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" /></svg>
                }
            </button>
            {currentUser && (
                <div className="relative">
                    <button onClick={handleAnnouncementsOpen} className="relative p-2 rounded-full text-gray-300 hover:bg-white/20 dark:hover:bg-gray-700 transition-colors">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                       {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>}
                    </button>
                    {isAnnouncementsOpen && (
                        <div onMouseLeave={() => setAnnouncementsOpen(false)} className="absolute right-0 mt-2 w-80 bg-white/80 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-xl border border-white/20 dark:border-gray-700 overflow-hidden">
                           <div className="p-3 font-bold text-center border-b dark:border-gray-700 text-gray-800 dark:text-white">Announcements</div>
                           <div className="max-h-96 overflow-y-auto">
                           {announcements.length > 0 ? announcements.map(ann => (
                               <div key={ann.id} className="p-3 border-b dark:border-gray-700 last:border-b-0 hover:bg-gray-100 dark:hover:bg-gray-700">
                                   <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{ann.title}</p>
                                   <p className="text-xs text-gray-600 dark:text-gray-400">{ann.body}</p>
                                   <p className="text-right text-xs text-gray-400 mt-1">{new Date(ann.createdAt?.toDate()).toLocaleDateString()}</p>
                               </div>
                           )) : <p className="p-4 text-center text-sm text-gray-500">No announcements yet.</p>}
                           </div>
                        </div>
                    )}
                </div>
            )}
            {currentUser ? (
              <div className="flex items-center flex-col lg:flex-row gap-4 lg:gap-3 text-gray-800 dark:text-gray-200">
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="w-full text-center px-4 py-2 hover:bg-white/20 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  Profile
                </Link>
                <button onClick={handleLogout} className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105">
                Login
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;