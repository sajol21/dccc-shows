import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import Header from './components/Header.js';
import Footer from './components/Footer.js';
import HomePage from './pages/HomePage.js';
import ShowsPage from './pages/ShowsPage.js';
import LeaderboardPage from './pages/LeaderboardPage.js';
import AboutPage from './pages/AboutPage.js';
import LoginPage from './pages/LoginPage.js';
import SignUpPage from './pages/SignUpPage.js';
import ForgotPasswordPage from './pages/ForgotPasswordPage.js';
import UserProfilePage from './pages/UserProfilePage.js';
import AdminDashboard from './pages/AdminDashboard.js';
import PostDetailPage from './pages/PostDetailPage.js';
import ProtectedRoute from './components/ProtectedRoute.js';
import AdminRoute from './components/AdminRoute.js';
import ProfileRedirect from './components/ProfileRedirect.js';
import VerifyEmailPage from './pages/VerifyEmailPage.js';
import CreatePostPage from './pages/CreatePostPage.js';
import SessionsPage from './pages/SessionsPage.js';
import SessionDetailPage from './pages/SessionDetailPage.js';
import { setupPushNotifications } from './services/firebaseService.js';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    // When a verified user logs in, set up push notifications.
    if (currentUser && currentUser.emailVerified) {
      setupPushNotifications();
    }
  }, [currentUser]);

  return (
    <div className="flex flex-col min-h-screen bg-black/60 text-gray-200">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shows" element={<ShowsPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/session/:id" element={<SessionDetailPage />} />
          <Route path="/post/:id" element={<PostDetailPage />} />
          <Route path="/user/:uid" element={<UserProfilePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfileRedirect />
            </ProtectedRoute>
          } />

          <Route path="/create" element={
            <ProtectedRoute>
              <CreatePostPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
