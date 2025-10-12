import { 
  doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, deleteDoc, writeBatch, orderBy, limit, startAfter, DocumentSnapshot, increment, arrayUnion, arrayRemove, Timestamp, onSnapshot, Unsubscribe
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../config/firebase.js';
import { UserProfile, Post, Suggestion, PromotionRequest, LeaderboardArchive, ArchivedUser, SiteConfig, Announcement, Notification, Session } from '../types.js';
import { UserRole, Province, LEADERBOARD_ROLES } from '../constants.js';
import { signOut, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from 'firebase/auth';

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

    const post = postSnap.data() as Post;
    const currentLikes = post.likes || [];
    const isLiked = currentLikes.includes(userId);

    // Only update the post document, removing the insecure cross-user profile update that was causing permission errors.
    await updateDoc(postRef, { 
        likes: isLiked ? arrayRemove(userId) : arrayUnion(userId) 
    });
};


// Suggestion Management
export const addSuggestion = async (postId: string, suggestionData: Omit<Suggestion, 'timestamp'>): Promise<void> => {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;

    const post = postSnap.data() as Post;
    
    const newSuggestion: Suggestion = {
      ...suggestionData,
      timestamp: Timestamp.now()
    };
    
    // Update the post document with the new suggestion. This is secure.
    await updateDoc(postRef, {
      suggestions: arrayUnion(newSuggestion)
    });

    // Send a notification, but do not update the author's score from the client.
    // The score can be updated by the author on their profile page.
    if (post.authorId !== suggestionData.commenterId) {
        await createNotification(
            post.authorId,
            "New suggestion on your show!",
            `${suggestionData.commenterName} left a suggestion on "${post.title}".`,
            `/post/${postId}`
        );
    }
};

// New function to allow users to securely update their own stats.
export const recalculateUserStats = async (userId: string): Promise<void> => {
    // 1. Fetch all posts by the user.
    const q = query(collection(db, 'posts'), where('authorId', '==', userId));
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(doc => doc.data() as Post);

    // 2. Calculate totals from the posts.
    let totalLikes = 0;
    let totalSuggestions = 0;
    posts.forEach(post => {
        totalLikes += post.likes?.length || 0;
        // Don't count user's own suggestions towards their score.
        totalSuggestions += post.suggestions?.filter(s => s.commenterId !== userId).length || 0;
    });

    // 3. Calculate leaderboard score. (1 point per like, 5 per suggestion)
    const leaderboardScore = totalLikes + (totalSuggestions * 5);

    // 4. Update the user's profile document.
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        totalLikes,
        totalSuggestions,
        leaderboardScore
    });
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
        userId