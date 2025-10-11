import { 
  doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, deleteDoc, writeBatch, orderBy, limit, startAfter, DocumentSnapshot, increment, arrayUnion, arrayRemove, Timestamp, onSnapshot, Unsubscribe
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth, messaging } from '../config/firebase.js';
import { UserProfile, Post, Suggestion, PromotionRequest, LeaderboardArchive, ArchivedUser, SiteConfig, Announcement, Notification, Session } from '../types.js';
import { UserRole, Province, LEADERBOARD_ROLES } from '../constants.js';
import { signOut, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from 'firebase/auth';
import { getToken, onMessage } from 'firebase/messaging';

// User Management
export const createUserProfile = async (uid: string, name: string, email: string, phone: string = '', batch: string = ''): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    uid,
    name,
    email,
    phone,
    batch,
    role: UserRole.GENERAL_STUDENT,
    province: Province.CULTURAL,
    totalLikes: 0,
    submissionsCount: 0,
    totalSuggestions: 0,
    leaderboardScore: 0,
    createdAt: serverTimestamp(),
    readAnnouncements: [],
    readNotifications: [],
  });
};

export const signInWithGoogle = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userProfile = await getUserProfile(user.uid);
    if (!userProfile) {
        await createUserProfile(user.uid, user.displayName || 'New User', user.email || '', '', '');
    }
};

export const resendVerificationEmail = async (): Promise<void> => {
    const user = auth.currentUser;
    if (user) {
        await sendEmailVerification(user);
    } else {
        throw new Error("No user is currently signed in.");
    }
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, data);
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

// Push Notification Management
const saveFcmToken = async (uid: string, token: string): Promise<void> => {
    const tokensRef = collection(db, 'fcmTokens');
    // Check if the token already exists for this user to avoid duplicates
    const q = query(tokensRef, where('uid', '==', uid), where('token', '==', token));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        // Token doesn't exist for this user, so add it
        await addDoc(tokensRef, {
            uid,
            token,
            createdAt: serverTimestamp(),
        });
        console.log('FCM token saved for user:', uid);
    } else {
        console.log('FCM token already exists for this user.');
    }
};

export const setupPushNotifications = async (): Promise<void> => {
    const user = auth.currentUser;
    if (!user || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log("User not logged in or push notifications not supported by this browser.");
        return;
    }

    try {
        // Register the service worker
        const serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            
            // IMPORTANT: Get this key from your Firebase project settings
            // Go to Project settings > Cloud Messaging > Web configuration > Generate key pair
            const vapidKey = 'BLTOXznAUb_pfx5ysd29tufXMIStZW5iexOpgyuet3GW6D6jseQ6Kvr49N8q8kCf1IsivSyC5BMtlZKiggVZ35M'; 
            // fix: Removed obsolete VAPID key placeholder check as the key is already set.
            // This resolved a TypeScript error about an impossible comparison.

            const currentToken = await getToken(messaging, { vapidKey: vapidKey, serviceWorkerRegistration });
            if (currentToken) {
                await saveFcmToken(user.uid, currentToken);
                // Handle messages that arrive while the app is in the foreground
                onMessage(messaging, (payload) => {
                    console.log('Foreground message received.', payload);
                    if (payload.notification) {
                         new Notification(payload.notification.title || 'New Notification', {
                            body: payload.notification.body,
                            icon: payload.notification.icon,
                        });
                    }
                });
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        } else {
            console.log('Unable to get permission to notify.');
        }
    } catch (error) {
        console.error('An error occurred while setting up push notifications.', error);
    }
};


// Post Management
export const createPost = async (
    postData: Omit<Post, 'id' | 'timestamp' | 'likes' | 'suggestions'>
): Promise<void> => {
    const batch = writeBatch(db);
    const newPostRef = doc(collection(db, 'posts'));

    batch.set(newPostRef, {
        ...postData,
        timestamp: serverTimestamp(),
        likes: [],
        suggestions: [],
    });

    const userRef = doc(db, 'users', postData.authorId);
    batch.update(userRef, {
        submissionsCount: increment(1)
    });

    await batch.commit();
};

export const updatePost = async (postId: string, data: Partial<Post>): Promise<void> => {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, data);
};

export const getPost = async (postId: string): Promise<Post | null> => {
    const postRef = doc(db, 'posts', postId);
    const docSnap = await getDoc(postRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Post;
    }
    return null;
}

// Gets posts for the main feed (from leaderboard-eligible members)
export const getPosts = async (lastVisible?: DocumentSnapshot, filters: any = {}): Promise<{ posts: Post[], lastVisible: DocumentSnapshot | null }> => {
    let q = query(
        collection(db, 'posts'), 
        where('approved', '==', true), 
        where('authorRole', 'in', LEADERBOARD_ROLES),
        orderBy('timestamp', 'desc')
    );

    if (filters.province) {
        q = query(q, where('province', '==', filters.province));
    }
    if (filters.type) {
        q = query(q, where('type', '==', filters.type));
    }
    if (filters.batch) {
        q = query(q, where('authorBatch', '==', filters.batch));
    }
    
    q = query(q, limit(9));

    if (lastVisible) {
        q = query(q, startAfter(lastVisible));
    }

    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

    return { posts, lastVisible: newLastVisible || null };
};

// Gets featured posts from high-ranking members
export const getFeaturedPosts = async (): Promise<Post[]> => {
    const highRankingRoles = Object.values(UserRole).filter(role => !LEADERBOARD_ROLES.includes(role));
    
    if (highRankingRoles.length === 0) return [];

    const q = query(
        collection(db, 'posts'),
        where('approved', '==', true),
        where('authorRole', 'in', highRankingRoles),
        orderBy('timestamp', 'desc'),
        limit(5)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
}


export const getPostsByAuthor = async (authorId: string): Promise<Post[]> => {
    const q = query(
        collection(db, 'posts'), 
        where('authorId', '==', authorId), 
        where('approved', '==', true), 
        orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
};

export const toggleLikePost = async (postId: string, userId: string): Promise<void> => {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;

    const batch = writeBatch(db);
    const post = postSnap.data() as Post;
    const authorRef = doc(db, 'users', post.authorId);
    const currentLikes = post.likes || [];
    
    const isLiked = currentLikes.includes(userId);
    const likeIncrement = isLiked ? -1 : 1;

    // Update post likes array
    batch.update(postRef, { 
        likes: isLiked ? arrayRemove(userId) : arrayUnion(userId) 
    });

    // Update author's stats
    batch.update(authorRef, {
        totalLikes: increment(likeIncrement),
        leaderboardScore: increment(likeIncrement)
    });

    await batch.commit();
};


// Suggestion Management
export const addSuggestion = async (postId: string, suggestionData: Omit<Suggestion, 'timestamp'>): Promise<void> => {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;

    const batch = writeBatch(db);
    const post = postSnap.data() as Post;
    const authorRef = doc(db, 'users', post.authorId);
    
    const newSuggestion: Suggestion = {
      ...suggestionData,
      timestamp: Timestamp.now()
    };
    
    // Update post suggestions array
    batch.update(postRef, {
      suggestions: arrayUnion(newSuggestion)
    });

    // Update author's stats (e.g., 5 points per suggestion)
    batch.update(authorRef, {
        totalSuggestions: increment(1),
        leaderboardScore: increment(5)
    });

    await batch.commit();
};


// Leaderboard
export const getLeaderboardUsers = async (): Promise<UserProfile[]> => {
    const q = query(
        collection(db, 'users'), 
        where('role', 'in', LEADERBOARD_ROLES),
        orderBy('leaderboardScore', 'desc'), 
        limit(50)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
};

export const getLeaderboardArchives = async (): Promise<{id: string}[]> => {
    const q = query(collection(db, 'leaderboard_archives'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id }));
};

export const getArchivedLeaderboard = async (archiveId: string): Promise<LeaderboardArchive | null> => {
    const docRef = doc(db, 'leaderboard_archives', archiveId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as LeaderboardArchive;
    }
    return null;
};


// Site Settings
export const getSiteConfig = async (): Promise<SiteConfig | null> => {
    const docRef = doc(db, 'settings', 'siteConfig');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as SiteConfig;
    }
    // Return default config if it doesn't exist
    return {
        phone: '123-456-7890',
        email: 'info@dccc.com',
        socials: { facebook: '#', instagram: '#', youtube: '#' },
        bannerImageUrl: '',
        bannerLinkUrl: '#',
        minRoleToPost: UserRole.GENERAL_MEMBER,
    };
}

export const updateSiteConfig = async (data: Partial<SiteConfig>): Promise<void> => {
    const docRef = doc(db, 'settings', 'siteConfig');
    await setDoc(docRef, data, { merge: true });
}

// Announcements & Notifications
const createNotification = async (userId: string, title: string, body: string, link: string = ''): Promise<void> => {
    await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        body,
        link,
        read: false,
        createdAt: serverTimestamp()
    });
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
    const notificationRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notificationRef);
};

export const clearAllNotifications = async (userId: string): Promise<void> => {
  const q = query(collection(db, 'notifications'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) return;

  const batch = writeBatch(db);
  querySnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
};

export const onNotificationsUpdate = (userId: string, callback: (notifications: Notification[]) => void): Unsubscribe => {
    const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(15)
    );
    
    return onSnapshot(q, (querySnapshot) => {
        const notifications = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Notification);
        callback(notifications);
    });
};

export const createAnnouncement = async (title: string, body: string): Promise<void> => {
    await addDoc(collection(db, 'announcements'), {
        title,
        body,
        createdAt: serverTimestamp(),
    });
};

// fix: Added missing getAnnouncements function for admin dashboard.
export const getAnnouncements = async (): Promise<Announcement[]> => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Announcement);
};

export const onAnnouncementsUpdate = (callback: (announcements: Announcement[]) => void): Unsubscribe => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(10));

    return onSnapshot(q, (querySnapshot) => {
        const announcements = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Announcement);
        callback(announcements);
    });
};

export const markAnnouncementsAsRead = async (userId: string, announcementIds: string[]): Promise<void> => {
    if (announcementIds.length === 0) return;
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        readAnnouncements: arrayUnion(...announcementIds)
    });
};

export const markNotificationsAsRead = async (userId: string, notificationIds: string[]): Promise<void> => {
    if (notificationIds.length === 0) return;
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        readNotifications: arrayUnion(...notificationIds)
    });
};


// About Page
export const getCommitteeMembers = async (): Promise<UserProfile[]> => {
    const q = query(
        collection(db, 'users'), 
        where('role', 'in', [UserRole.ADMIN, UserRole.EXECUTIVE_MEMBER])
    );
    const querySnapshot = await getDocs(q);
    const members = querySnapshot.docs.map(doc => doc.data() as UserProfile);
    // Sort admins first, then by name
    return members.sort((a, b) => {
        if (a.role === UserRole.ADMIN && b.role !== UserRole.ADMIN) return -1;
        if (a.role !== UserRole.ADMIN && b.role === UserRole.ADMIN) return 1;
        return a.name.localeCompare(b.name);
    });
};


// Admin Functions
export const getAllUsers = async (): Promise<UserProfile[]> => {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
}

export const updateUserRole = async (uid: string, role: UserRole): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role });
}

export const getAllPostsAdmin = async (): Promise<Post[]> => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
}

export const approvePost = async (postId: string, approved: boolean): Promise<void> => {
    const postRef = doc(db, 'posts', postId);
    
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) {
        console.error("Post not found, cannot send notification:", postId);
        return; // Exit if post doesn't exist
    }
    const post = postSnap.data() as Post;
    
    await updateDoc(postRef, { approved });

    // Create notification for the author
    if (approved) {
        await createNotification(
            post.authorId,
            "Your show is live!",
            `Congratulations! Your show "${post.title}" has been approved and is now public.`,
            `/post/${postId}`
        );
    } else {
        await createNotification(
            post.authorId,
            "Update on your show",
            `An administrator has updated the visibility for your show "${post.title}". It is no longer public.`,
            `/post/${postId}`
        );
    }
}

export const deletePost = async (post: Post): Promise<void> => {
    const postRef = doc(db, 'posts', post.id);
    const userRef = doc(db, 'users', post.authorId);

    // Create notification before deleting the post
    await createNotification(
        post.authorId,
        "Your show was removed",
        `An administrator has removed your show "${post.title}" from the platform.`,
        `/user/${post.authorId}` // Link to user's profile as post is gone
    );

    const batch = writeBatch(db);
    batch.delete(postRef);

    // Decrement user stats. This is important for leaderboard accuracy.
    const likesCount = post.likes?.length || 0;
    const suggestionsCount = post.suggestions?.length || 0;
    const scoreToRemove = likesCount + (suggestionsCount * 5);

    batch.update(userRef, {
        submissionsCount: increment(-1),
        totalLikes: increment(-likesCount),
        totalSuggestions: increment(-suggestionsCount),
        leaderboardScore: increment(-scoreToRemove)
    });

    await batch.commit();
}

export const resetLeaderboard = async (): Promise<void> => {
    // 1. Get current top users to archive them
    const topUsersQuery = query(collection(db, 'users'), where('leaderboardScore', '>', 0), orderBy('leaderboardScore', 'desc'));
    const topUsersSnapshot = await getDocs(topUsersQuery);

    const usersToArchive: ArchivedUser[] = topUsersSnapshot.docs.map(doc => {
        const user = doc.data() as UserProfile;
        return {
            uid: user.uid,
            name: user.name,
            batch: user.batch,
            role: user.role,
            leaderboardScore: user.leaderboardScore,
        };
    });

    // 2. Create archive document if there are users with scores
    if (usersToArchive.length > 0) {
        const now = new Date();
        // Use last month's date for the archive ID
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const archiveId = `${lastMonth.getFullYear()}-${(lastMonth.getMonth() + 1).toString().padStart(2, '0')}`;
        
        const archiveRef = doc(db, 'leaderboard_archives', archiveId);
        await setDoc(archiveRef, {
            createdAt: serverTimestamp(),
            users: usersToArchive,
        });
    }

    // 3. Reset scores for all users who had a score
    const batch = writeBatch(db);
    topUsersSnapshot.forEach(userDoc => {
        batch.update(userDoc.ref, { 
            totalLikes: 0,
            totalSuggestions: 0,
            leaderboardScore: 0
        });
    });
    await batch.commit();
}

// Promotion Requests
export const createPromotionRequest = async (user: UserProfile, requestedRole: UserRole): Promise<void> => {
    await addDoc(collection(db, 'promotionRequests'), {
        userId: user.uid,
        userName: user.name,
        userBatch: user.batch,
        currentRole: user.role,
        requestedRole: requestedRole,
        status: 'pending',
        createdAt: serverTimestamp(),
    });
};

export const getUsersPendingRequest = async (userId: string): Promise<PromotionRequest | null> => {
    const q = query(
        collection(db, 'promotionRequests'),
        where('userId', '==', userId),
        where('status', '==', 'pending'),
        limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as PromotionRequest;
    }
    return null;
};

export const getPendingPromotionRequests = async (): Promise<PromotionRequest[]> => {
    const q = query(
        collection(db, 'promotionRequests'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromotionRequest));
};

export const approvePromotionRequest = async (requestId: string, userId: string, newRole: UserRole): Promise<void> => {
    const batch = writeBatch(db);
    const requestRef = doc(db, 'promotionRequests', requestId);
    batch.update(requestRef, { status: 'approved' });
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, { role: newRole });
    await batch.commit();

    await createNotification(userId, "Promotion Approved!", `Congratulations, your role has been updated to ${newRole}.`, `/user/${userId}`);
};

export const rejectPromotionRequest = async (requestId: string, userId: string): Promise<void> => {
    const requestRef = doc(db, 'promotionRequests', requestId);
    await updateDoc(requestRef, { status: 'rejected' });
    await createNotification(userId, "Promotion Request Update", "Your recent promotion request was not approved at this time.", `/user/${userId}`);
};

// Session Management
export const createSession = async (sessionData: Omit<Session, 'id' | 'createdAt' | 'status'>): Promise<void> => {
    await addDoc(collection(db, 'sessions'), {
        ...sessionData,
        status: 'upcoming',
        createdAt: serverTimestamp(),
    });
    // Also create a global announcement for the session
    await createAnnouncement(
        `New ${sessionData.type}: ${sessionData.title}`,
        sessionData.description
    );
};

export const getSessions = async (): Promise<Session[]> => {
    const q = query(collection(db, 'sessions'), orderBy('eventDate', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
};

export const getSession = async (sessionId: string): Promise<Session | null> => {
    const sessionRef = doc(db, 'sessions', sessionId);
    const docSnap = await getDoc(sessionRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Session;
    }
    return null;
}

export const updateSession = async (sessionId: string, data: Partial<Session>): Promise<void> => {
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, data);
};

export const deleteSession = async (sessionId: string): Promise<void> => {
    const sessionRef = doc(db, 'sessions', sessionId);
    await deleteDoc(sessionRef);
};