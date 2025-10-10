import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { logout, getAnnouncements, markAnnouncementsAsRead, getNotifications, markNotificationsAsRead } from '../services/firebaseService';
import { UserRole } from '../constants';
import { Announcement, Notification as NotificationType } from '../types';

const Header: React.FC = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userProfile) {
      const fetchNotifications = async () => {
        const [allAnnouncements, personalNotifications] = await Promise.all([
          getAnnouncements(),
          getNotifications(userProfile.uid)
        ]);

        setAnnouncements(allAnnouncements);
        setNotifications(personalNotifications);

        const readAnnouncements = userProfile.readAnnouncements || [];
        const unreadAnnouncements = allAnnouncements.filter(a => !readAnnouncements.includes(a.id)).length;
        
        const readNotifications = userProfile.readNotifications || [];
        const unreadNotifications = personalNotifications.filter(n => !readNotifications.includes(n.id)).length;

        const totalUnread = unreadAnnouncements + unreadNotifications;
        setUnreadCount(totalUnread);

        if (totalUnread > 0 && Notification.permission === 'granted') {
           const latestUnreadAnn = allAnnouncements.filter(a => !readAnnouncements.includes(a.id))[0];
           if (latestUnreadAnn) {
             new Notification(latestUnreadAnn.title, { body: latestUnreadAnn.body, icon: '/vite.svg' });
           }
        }
      };
      fetchNotifications();
    }
  }, [userProfile, loading]);

  const requestNotificationPermission = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
      }
  };
  
  useEffect(() => {
    if(currentUser) {
        setTimeout(requestNotificationPermission, 5000);
    }
  }, [currentUser]);


  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };
  
  const handleNotificationsOpen = async () => {
      setNotificationsOpen(true);
      if (userProfile && unreadCount > 0) {
          const readAnn = userProfile.readAnnouncements || [];
          const unreadAnnIds = announcements.filter(a => !readAnn.includes(a.id)).map(a => a.id);
          if(unreadAnnIds.length > 0) await markAnnouncementsAsRead(userProfile.uid, unreadAnnIds);
          
          const readNotif = userProfile.readNotifications || [];
          const unreadNotifIds = notifications.filter(n => !readNotif.includes(n.id)).map(n => n.id);
          if(unreadNotifIds.length > 0) await markNotificationsAsRead(userProfile.uid, unreadNotifIds);
          
          setUnreadCount(0);
      }
  }

  const NavLink: React.FC<{ to: string; children: React.ReactNode; isMobile?: boolean }> = ({ to, children, isMobile }) => (
    <Link 
      to={to} 
      onClick={() => setMobileMenuOpen(false)} 
      className={`font-medium text-gray-300 hover:text-blue-400 transition-colors duration-300 
      ${isMobile ? 'text-3xl py-4' : 'text-base px-3 py-2'}`}
    >
      {children}
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-50 bg-gray-900/70 backdrop-blur-lg border-b border-gray-700/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Link to="/" className="flex-shrink-0">
            <img src="https://res.cloudinary.com/dabfeqgsj/image/upload/v1759778648/cyizstrjgcq0w9fr8cxp.png" alt="DCCC Logo" className="h-10 w-auto" />
          </Link>
          
          <nav className="hidden lg:flex items-center space-x-2">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/shows">Shows</NavLink>
            <NavLink to="/leaderboard">Leaderboard</NavLink>
            <NavLink to="/about">About</NavLink>
            {userProfile?.role === UserRole.ADMIN && <NavLink to="/admin">Admin</NavLink>}
          </nav>

          <div className="flex items-center gap-2">
            {currentUser && (
                <div className="relative">
                    <button onClick={handleNotificationsOpen} className="relative p-2 rounded-full text-gray-400 hover:bg-gray-700 transition-colors">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                       {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-gray-900"></span>}
                    </button>
                    {isNotificationsOpen && (
                        <div onMouseLeave={() => setNotificationsOpen(false)} className="absolute right-0 mt-2 w-80 bg-gray-900/80 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 overflow-hidden">
                           <div className="max-h-[70vh] overflow-y-auto">
                           {notifications.length > 0 && (
                               <div>
                                   <div className="p-3 font-bold text-center border-b border-gray-700 text-gray-200 bg-gray-800/50 sticky top-0">Personal</div>
                                   {notifications.map(notif => (
                                       <div key={notif.id} className="p-3 border-b border-gray-700 last:border-b-0 hover:bg-gray-800">
                                           <p className="font-semibold text-sm text-blue-300">{notif.title}</p>
                                           <p className="text-xs text-gray-400">{notif.body}</p>
                                           <p className="text-right text-xs text-gray-500 mt-1">{notif.createdAt ? new Date(notif.createdAt.toDate()).toLocaleDateString() : ''}</p>
                                       </div>
                                   ))}
                               </div>
                           )}
                           {announcements.length > 0 && (
                               <div>
                                   <div className="p-3 font-bold text-center border-b border-gray-700 text-gray-200 bg-gray-800/50 sticky top-0">Announcements</div>
                                   {announcements.map(ann => (
                                       <div key={ann.id} className="p-3 border-b border-gray-700 last:border-b-0 hover:bg-gray-800">
                                           <p className="font-semibold text-sm text-gray-200">{ann.title}</p>
                                           <p className="text-xs text-gray-400">{ann.body}</p>
                                           <p className="text-right text-xs text-gray-500 mt-1">{ann.createdAt ? new Date(ann.createdAt.toDate()).toLocaleDateString() : ''}</p>
                                       </div>
                                   ))}
                               </div>
                           )}
                           {notifications.length === 0 && announcements.length === 0 && <p className="p-4 text-center text-sm text-gray-500">The stage is quiet... for now.</p>}
                           </div>
                        </div>
                    )}
                </div>
            )}
             <div className="hidden lg:flex items-center gap-3">
                {currentUser ? (
                    <>
                        <Link to="/profile" className="px-4 py-2 hover:bg-gray-700 rounded-lg transition-colors font-semibold text-gray-300">Profile</Link>
                        <button onClick={handleLogout} className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105">Logout</button>
                    </>
                ) : (
                    <Link to="/login" className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105">Login</Link>
                )}
            </div>
            <div className="block lg:hidden">
              <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-400 focus:outline-none">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 bg-gray-900/80 backdrop-blur-lg transition-opacity duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setMobileMenuOpen(false)}>
        <div className={`fixed top-0 right-0 h-full w-full flex flex-col items-center justify-center transition-transform duration-500 ease-in-out transform ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-10'}`}>
            <nav className="flex flex-col items-center justify-center text-center gap-4">
                <NavLink to="/" isMobile>Home</NavLink>
                <NavLink to="/shows" isMobile>Shows</NavLink>
                <NavLink to="/leaderboard" isMobile>Leaderboard</NavLink>
                <NavLink to="/about" isMobile>About</NavLink>
                {userProfile?.role === UserRole.ADMIN && <NavLink to="/admin" isMobile>Admin</NavLink>}
            </nav>
            <div className="mt-8 flex flex-col items-center gap-4 w-48">
                {currentUser ? (
                    <>
                        <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="w-full text-center text-xl font-semibold px-4 py-3 bg-gray-700 text-gray-200 rounded-lg transition-colors">Profile</Link>
                        <button onClick={handleLogout} className="w-full text-center text-xl font-semibold px-4 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-lg shadow-md">Logout</button>
                    </>
                ) : (
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center text-xl font-semibold px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md">Login</Link>
                )}
            </div>
        </div>
      </div>
    </>
  );
};

export default Header;