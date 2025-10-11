import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '../config/firebase.js';
import { UserProfile } from '../types.js';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Unsubscribe from old profile listener if it exists
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }

      setCurrentUser(user);

      if (user) {
        setLoading(true); // Set loading while we fetch the profile for the first time
        const userRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            console.warn("User profile document not found for UID:", user.uid);
            setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user profile:", error);
          setUserProfile(null);
          setLoading(false);
        });
      } else {
        // User is signed out, clear data
        setUserProfile(null);
        setLoading(false);
      }
    });

    // Cleanup on component unmount
    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
