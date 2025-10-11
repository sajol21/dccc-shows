import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { logout, onAnnouncementsUpdate, markAnnouncementsAsRead, onNotificationsUpdate, markNotificationsAsRead, deleteNotification, clearAllNotifications } from '../services/firebaseService.js';
import { UserRole } from '../constants.js';
import { Announcement, Notification as NotificationType } from '../types.js';
import { Unsubscribe } from 'firebase/firestore';

const Header: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let unsubAnnouncements: Unsubscribe | null = null;
    let unsubNotifications: Unsubscribe | null = null;
    
    if (userProfile) {
        unsubAnnouncements = onAnnouncementsUpdate(setAnnouncements);
        unsubNotifications = onNotificationsUpdate(userProfile.uid, setNotifications);
    } else {
        // When user logs out, clear the state
        setAnnouncements([]);
        setNotifications([]);
        setUnreadCount(0);
    }
    
    return () => {
        if(unsubAnnouncements) unsubAnnouncements();
        if(unsubNotifications) unsubNotifications();
    }
  }, [userProfile]);
  
  useEffect(() => {
      if(userProfile) {
        const readAnnouncements = userProfile.readAnnouncements || [];
        const unreadAnnouncements = announcements.filter(a => !readAnnouncements.includes(a.id));
        
        const readNotifications = userProfile.readNotifications || [];
        const unreadNotifications = notifications.filter(n => !readNotifications.includes(n.id));

        const totalUnread = unreadAnnouncements.length + unreadNotifications.length;
        setUnreadCount(totalUnread);
      }
  }, [userProfile, announcements, notifications]);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };
  
  const handleToggleNotifications = async () => {
      const opening = !isNotificationsOpen;
      setNotificationsOpen(opening);
      
      if (opening && userProfile && unreadCount > 0) {
          const readAnn = userProfile.readAnnouncements || [];
          const unreadAnnIds = announcements.filter(a => !readAnn.includes(a.id)).map(a => a.id);
          if(unreadAnnIds.length > 0) await markAnnouncementsAsRead(userProfile.uid, unreadAnnIds);
          
          const readNotif = userProfile.readNotifications || [];
          const unreadNotifIds = notifications.filter(n => !readNotif.includes(n.id)).map(n => n.id);
          if(unreadNotifIds.length > 0) await markNotificationsAsRead(userProfile.uid, unreadNotifIds);
          
          setUnreadCount(0); // Optimistically set to 0, profile listener will confirm
      }
  };

  const handleClearAllNotifications = async () => {
      if (window.confirm('Are you sure you want to delete ALL your personal notifications?')) {
          try {
              if (userProfile) {
                  await clearAllNotifications(userProfile.uid);
                  // The onSnapshot listener will handle the UI update automatically.
              }
          } catch (error) {
              console.error("Failed to clear notifications:", error);
              alert("Could not clear notifications. Please try again.");
          }
      }
  };

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
            setNotificationsOpen(false);
        }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
  
  const NotificationItem: React.FC<{item: NotificationType | Announcement, isPersonal: boolean}> = ({ item, isPersonal }) => {
    const handleDelete = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.confirm('Are you sure you want to delete this notification?')) {
          try {
              await deleteNotification(item.id);
              // The onSnapshot listener will handle the UI update automatically.
          } catch (error) {
              console.error("Failed to delete notification:", error);
              alert("Could not delete notification. Please try again.");
          }
      }
    };

    const content = (
      <div className={`relative p-3 border-b border-gray-700 last:border-b-0 ${'link' in item && item.link ? 'hover:bg-gray-700 cursor-pointer' : 'hover:bg-gray-700/50'} group`}>
          <p className={`font-semibold text-sm ${isPersonal ? 'text-blue-300' : 'text-gray-200'}`}>{item.title}</p>
          <p className="text-xs text-gray-400">{item.body}</p>
          <p className="text-right text-xs text-gray-500 mt-1">{item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString() : ''}</p>
          {isPersonal && (
            <button 
                onClick={handleDelete}
                className="absolute top-1 right-1 p-1 rounded-full text-gray-500 hover:bg-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete notification"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
      </div>
    );
    
    if ('link' in item && item.link) {
      return <Link to={item.link} onClick={() => setNotificationsOpen(false)}>{content}</Link>
    }
    return content;
  };


  return (
    <>
      <header className="sticky top-0 z-50 bg-gray-900/70 backdrop-blur-lg border-b border-gray-700/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Link to="/" className="flex-shrink-0">
            <img src="https://res.cloudinary.com/dabfeqgsj/image/upload/v1759778648/cyizstrjgcq0w9fr8cxp.png" alt="DCCC Logo" className="h-10 w-auto" />
          </Link>
          
          <nav className="hidden md:flex items-center space-x-2">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/shows">Shows</NavLink>
            <NavLink to="/sessions">Sessions</NavLink>
            <NavLink to="/leaderboard">Leaderboard</NavLink>
            <NavLink to="/about">About</NavLink>
            {userProfile?.role === UserRole.ADMIN && <NavLink to="/admin">Admin</NavLink>}
          </nav>

          <div className="flex items-center gap-2">
            {currentUser && (
                <div className="relative" ref={notificationsRef}>
                    <button onClick={handleToggleNotifications} className="relative p-2 rounded-full text-gray-400 hover:bg-gray-700 transition-colors">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                       {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-gray-900"></span>}
                    </button>
                    {isNotificationsOpen && (
                        <>
                          {/* Backdrop for mobile view */}
                          <div 
                              className="fixed inset-0 bg-black/50 z-40 sm:hidden"
                              onClick={() => setNotificationsOpen(false)}
                          ></div>
                          {/* Notification Panel */}
                          <div className="fixed top-16 left-1/2 -translate-x-1/2 w-[95vw] max-w-sm sm:absolute sm:left-auto sm:right-0 sm:translate-x-0 sm:top-auto sm:mt-2 sm:w-96 bg-gray-800 rounded-lg shadow-xl border border-gray-600 overflow-hidden z-50">
                            <div className="max-h-[70vh] overflow-y-auto">
                            {notifications.length > 0 && (
                                <div>
                                    <div className="p-3 font-bold text-center border-b border-gray-700 text-gray-200 bg-gray-900/50 sticky top-0">Personal</div>
                                    {notifications.map(notif => (
                                        <NotificationItem key={notif.id} item={notif} isPersonal={true} />
                                    ))}
                                    <div className="p-2 text-center border-t border-gray-700">
                                        <button onClick={handleClearAllNotifications} className="text-xs text-red-400 hover:underline">
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                            )}
                            {announcements.length > 0 && (
                                <div>
                                    <div className="p-3 font-bold text-center border-b border-gray-700 text-gray-200 bg-gray-900/50 sticky top-0">Announcements</div>
                                    {announcements.map(ann => (
                                        <NotificationItem key={ann.id} item={ann} isPersonal={false} />
                                    ))}
                                </div>
                            )}
                            {notifications.length === 0 && announcements.length === 0 && <p className="p-4 text-center text-sm text-gray-500">The stage is quiet... for now.</p>}
                            </div>
                          </div>
                        </>
                    )}
                </div>
            )}
             <div className="hidden md:flex items-center gap-3">
                {currentUser ? (
                    <>
                        <Link to="/profile" className="px-4 py-2 hover:bg-gray-700 rounded-lg transition-colors font-semibold text-gray-300">Profile</Link>
                        <button onClick={handleLogout} className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105">Logout</button>
                    </>
                ) : (
                    <Link to="/login" className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105">Login</Link>
                )}
            </div>
            <div className="block md:hidden">
              <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-400 focus:outline-none">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-[100] bg-gray-900/80 backdrop-blur-lg transition-opacity duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setMobileMenuOpen(false)}>
        <div className={`relative fixed top-0 right-0 h-full w-full flex flex-col items-center justify-center transition-transform duration-500 ease-in-out transform ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-10'}`} onClick={(e) => e.stopPropagation()}>
            <button 
                onClick={() => setMobileMenuOpen(false)} 
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                aria-label="Close menu"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <nav className="flex flex-col items-center justify-center text-center gap-4">
                <NavLink to="/" isMobile>Home</NavLink>
                <NavLink to="/shows" isMobile>Shows</NavLink>
                <NavLink to="/sessions" isMobile>Sessions</NavLink>
                <NavLink to="/leaderboard" isMobile>Leaderboard</NavLink>
                <NavLink to="/about" isMobile>About</NavLink>
                {userProfile?.role === UserRole.ADMIN && <NavLink to="/admin" isMobile>Admin</NavLink>}
            </nav>
            <div className="mt-8 flex flex-col items-center gap-4 w-48">
                {currentUser ? (
                    <>
                      <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="w-full text-center text-xl font-semibold px-4 py-3 bg-gray-700 text-white rounded-lg shadow-md">Profile</Link>
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