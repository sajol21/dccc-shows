import { 
  doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, deleteDoc, writeBatch, orderBy, limit, startAfter, DocumentSnapshot, increment, arrayUnion, arrayRemove, Timestamp, onSnapshot, Unsubscribe
} from 'firebase/firestore';
// Added deleteObject for cleaning up storage on post deletion.
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../config/firebase.js';
import { UserProfile, Post, Suggestion, PromotionRequest, LeaderboardArchive, ArchivedUser, SiteConfig, Announcement, Notification, Session } from '../types.js';
import { UserRole, Province, LEADERBOARD_ROLES } from '../constants.js';
import { signOut, GoogleAuthProvider, signInWithPopup, sendEmailVerification, User } from 'firebase/auth';

declare var ImageKit: any;

// --- ImageKit Configuration ---
// =================================================================================================
// These credentials have been configured based on your input. If you encounter
// upload issues, please double-check these values in your ImageKit.io dashboard.
// 1. Go to https://imagekit.io/
// 2. Find your "URL-endpoint" on the dashboard.
// 3. Go to Developer -> API Keys and find your "Public key".
// =================================================================================================
const IMAGEKIT_PUBLIC_KEY = "public_ep/CKsKqDroGSubHYP8VD7xqvnE=";
const IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/dccc/";


let imagekitInstance: any;

const getImageKit = () => {
    if (typeof ImageKit === 'undefined') {
        console.error("ImageKit SDK not loaded. Make sure the script is included in your index.html.");
        return null;
    }
    if (!imagekitInstance) {
        if (!IMAGEKIT_PUBLIC_KEY || IMAGEKIT_PUBLIC_KEY.includes('REPLACE') || IMAGEKIT_PUBLIC_KEY.includes('sample')) {
            console.error("ImageKit public key is not configured. Please replace the example key in services/firebaseService.ts");
            return null;
        }
        if (!IMAGEKIT_URL_ENDPOINT || IMAGEKIT_URL_ENDPOINT.includes('REPLACE') || IMAGEKIT_URL_ENDPOINT.includes('sample')) {
            console.error("ImageKit URL endpoint is not configured. Please replace the example endpoint in services/firebaseService.ts");
            return null;
        }
        imagekitInstance = new ImageKit({
            publicKey: IMAGEKIT_PUBLIC_KEY,
            urlEndpoint: IMAGEKIT_URL_ENDPOINT,
        });
    }
    return imagekitInstance;
}

/**
 * Uploads an image file to ImageKit using client-side unsigned upload.
 * 
 * SECURITY NOTE: This is an "unsigned" upload. For it to work, you must:
 * 1. Go to your ImageKit Dashboard -> Settings -> Upload.
 * 2. Ensure "Allow unsigned image uploading" is ENABLED.
 * 3. For better security, consider adding restrictions in your dashboard, such as:
 *    - Restricting uploads to specific file types (e.g., JPG, PNG, WEBP).
 *    - Limiting file size.
 *    - Restricting uploads to come from your website's domain (Origin).
 * 
 * For maximum security, use "signed" uploads, which require a backend server 
 * (like a Firebase Cloud Function) to generate a signature.
 * 
 * @param file The image file to upload.
 * @param onProgress A callback function to track upload progress (0-100).
 * @returns A promise that resolves with the upload result, including the file URL.
 */
export const uploadImage = (file: File, onProgress: (progress: number) => void): Promise<{ url: string }> => {
    const imagekit = getImageKit();
    if (!imagekit) {
        return Promise.reject("ImageKit is not configured. Please check credentials in services/firebaseService.ts");
    }
    return imagekit.upload({
        file: file,
        fileName: file.name,
        useUniqueFileName: true,
        tags: ["dccc-post"],
        onUploadProgress: (evt) => {
            // Some browsers might not provide total size, so we check lengthComputable.
            if (evt.lengthComputable) {
                const progress = Math.round((evt.loaded / evt.total) * 100);
                onProgress(progress);
            }
        },
    });
};


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

export const signInWithGoogle = async (): Promise<{ user: User, isNewUser: boolean }> => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userProfile = await getUserProfile(user.uid);
    if (!userProfile) {
        await createUserProfile(user.uid, user.displayName || 'New User', user.email || '');
    }
    const isNewUser = !userProfile || !userProfile.phone || !userProfile.batch;
    return { user, isNewUser };
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

    if (!postSnap.exists()) {
        throw new Error("Post not found");
    }

    const post = postSnap.data() as Post;
    const authorRef = doc(db, 'users', post.authorId);
    const isLiked = (post.likes || []).includes(userId);
    const likeIncrement = isLiked ? -1 : 1;

    const batch = writeBatch(db);

    // Update post likes array
    batch.update(postRef, {
        likes: isLiked ? arrayRemove(userId) : arrayUnion(userId)
    });

    // Update author's stats if they aren't liking their own post
    if (post.authorId !== userId) {
        batch.update(authorRef, {
            totalLikes: increment(likeIncrement),
            leaderboardScore: increment(likeIncrement * 2) // 2 points per appreciate
        });
    }

    await batch.commit();
};


// Suggestion Management
export const addSuggestion = async (postId: string, suggestionData: Omit<Suggestion, 'timestamp'>): Promise<void> => {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
        throw new Error("Post not found");
    }
    
    const post = postSnap.data() as Post;
    const authorRef = doc(db, 'users', post.authorId);
    
    const newSuggestion: Suggestion = {
      ...suggestionData,
      timestamp: Timestamp.now()
    };
    
    const batch = writeBatch(db);
    
    // 1. Update the post with the new suggestion.
    batch.update(postRef, {
      suggestions: arrayUnion(newSuggestion)
    });

    // 2. Update author's stats if they aren't suggesting on their own post
    if (post.authorId !== suggestionData.commenterId) {
        batch.update(authorRef, {
            totalSuggestions: increment(1),
            leaderboardScore: increment(1) // 1 point per suggestion
        });
    }

    // 3. Create a notification for the author.
    if (post.authorId !== suggestionData.commenterId) {
        const notificationRef = doc(collection(db, 'notifications'));
        batch.set(notificationRef, {
            userId: post.authorId,
            title: "New suggestion on your show!",
            body: `${suggestionData.commenterName} left a suggestion on "${post.title}".`,
            link: `/post/${postId}`,
            read: false,
            createdAt: serverTimestamp(),
        });
    }
    
    await batch.commit();
};

export const recalculateUserStats = async (userId: string): Promise<void> => {
    // 1. Get all posts by the user
    const postsQuery = query(collection(db, 'posts'), where('authorId', '==', userId));
    const postsSnapshot = await getDocs(postsQuery);
    
    let totalLikes = 0;
    let totalSuggestions = 0;

    // 2. Iterate over posts and sum up stats
    postsSnapshot.forEach(doc => {
        const post = doc.data() as Post;
        totalLikes += (post.likes || []).length;
        totalSuggestions += (post.suggestions || []).length;
    });

    const leaderboardScore = (totalLikes * 2) + totalSuggestions;
    const submissionsCount = postsSnapshot.size;

    // 3. Update the user's own profile. This is a secure operation.
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        totalLikes,
        totalSuggestions,
        leaderboardScore,
        submissionsCount // Also keep this in sync
    });
};


// Leaderboard
export const onLeaderboardUpdate = (callback: (users: UserProfile[]) => void): Unsubscribe => {
    const q = query(
        collection(db, 'users'),
        where('role', 'in', LEADERBOARD_ROLES),
        orderBy('leaderboardScore', 'desc'),
        limit(50)
    );

    return onSnapshot(q, (querySnapshot) => {
        const users = querySnapshot.docs.map(doc => doc.data() as UserProfile);
        
        // Secondary sort for users with the same score
        users.sort((a, b) => {
            if (a.leaderboardScore !== b.leaderboardScore) {
                return b.leaderboardScore - a.leaderboardScore;
            }
            return a.name.localeCompare(b.name);
        });

        callback(users);
    });
};

export const getBestPostForUserInMonth = async (userId: string, yearMonth: string): Promise<Post | null> => {
    // yearMonth is 'YYYY-MM'
    const [year, month] = yearMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1); // Next month's first day is exclusive boundary

    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const q = query(
        collection(db, 'posts'),
        where('authorId', '==', userId),
        where('timestamp', '>=', startTimestamp),
        where('timestamp', '<', endTimestamp),
        where('approved', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));

    if (posts.length === 0) {
        return null;
    }

    // Find the best post based on score
    let bestPost: Post | null = null;
    let highestScore = -1;

    for (const post of posts) {
        const score = (post.likes?.length || 0) * 2 + (post.suggestions?.length || 0);
        if (score > highestScore) {
            highestScore = score;
            bestPost = post;
        }
    }

    return bestPost;
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
        createdAt: serverTimestamp(),
    });
};

export const onAnnouncementsUpdate = (callback: (announcements: Announcement[]) => void): Unsubscribe => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(10));
    return onSnapshot(q, (querySnapshot) => {
        const announcements = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
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

export const onNotificationsUpdate = (userId: string, callback: (notifications: Notification[]) => void): Unsubscribe => {
    const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(20)
    );
    return onSnapshot(q, (querySnapshot) => {
        const notifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        callback(notifications);
    });
};

export const markNotificationsAsRead = async (userId: string, notificationIds: string[]): Promise<void> => {
    if (notificationIds.length === 0) return;
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        readNotifications: arrayUnion(...notificationIds)
    });
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
    const notifRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notifRef);
};

export const clearAllNotifications = async (userId: string): Promise<void> => {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
};

export const getCommitteeMembers = async (): Promise<UserProfile[]> => {
    const committeeRoles = [UserRole.EXECUTIVE_MEMBER, UserRole.ADMIN];
    const q = query(collection(db, 'users'), where('role', 'in', committeeRoles));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
}

export const deletePost = async (post: Post): Promise<void> => {
    const batch = writeBatch(db);
    const postRef = doc(db, 'posts', post.id);
    batch.delete(postRef);

    const userRef = doc(db, 'users', post.authorId);
    batch.update(userRef, {
        submissionsCount: increment(-1)
    });

    if (post.mediaURL && post.mediaURL.includes('firebasestorage.googleapis.com')) {
        try {
            const fileRef = ref(storage, post.mediaURL);
            await deleteObject(fileRef);
        } catch (error: any) {
            if (error.code !== 'storage/object-not-found') {
                console.error("Error deleting file from storage:", error);
            }
        }
    }
    
    await batch.commit();
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
};

export const updateUserRole = async (uid: string, role: UserRole): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role });
};

export const getAllPostsAdmin = async (): Promise<Post[]> => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
};

export const approvePost = async (postId: string, approved: boolean): Promise<void> => {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, { approved });
};

export const resetLeaderboard = async (): Promise<void> => {
    const batch = writeBatch(db);
    const q = query(collection(db, 'users'), where('role', 'in', LEADERBOARD_ROLES));
    const usersSnapshot = await getDocs(q);
    
    const archivedUsers: ArchivedUser[] = [];
    usersSnapshot.forEach(userDoc => {
        const user = userDoc.data() as UserProfile;
        archivedUsers.push({
            uid: user.uid,
            name: user.name,
            batch: user.batch,
            role: user.role,
            leaderboardScore: user.leaderboardScore,
        });
        batch.update(userDoc.ref, {
            leaderboardScore: 0,
            totalLikes: 0,
            totalSuggestions: 0,
        });
    });

    const archiveId = new Date().toISOString().slice(0, 7);
    const archiveRef = doc(db, 'leaderboard_archives', archiveId);
    batch.set(archiveRef, {
        id: archiveId,
        createdAt: serverTimestamp(),
        users: archivedUsers,
    });

    await batch.commit();
};

export const createAnnouncement = async (title: string, body: string): Promise<void> => {
    await addDoc(collection(db, 'announcements'), {
        title,
        body,
        createdAt: serverTimestamp()
    });
};

export const getAnnouncements = async (): Promise<Announcement[]> => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
};

export const getPendingPromotionRequests = async (): Promise<PromotionRequest[]> => {
    const q = query(collection(db, 'promotion_requests'), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromotionRequest));
};

export const approvePromotionRequest = async (requestId: string, userId: string, requestedRole: UserRole): Promise<void> => {
    const batch = writeBatch(db);
    const requestRef = doc(db, 'promotion_requests', requestId);
    batch.update(requestRef, { status: 'approved' });
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, { role: requestedRole });
    await batch.commit();
    await createNotification(userId, "Promotion Approved!", `Congratulations! You have been promoted to ${requestedRole}.`, `/user/${userId}`);
};

export const rejectPromotionRequest = async (requestId: string, userId: string): Promise<void> => {
    const requestRef = doc(db, 'promotion_requests', requestId);
    await updateDoc(requestRef, { status: 'rejected' });
    await createNotification(userId, "Promotion Request Update", "Your recent promotion request was not approved at this time. Keep up the great work!");
};

export const createPromotionRequest = async (user: UserProfile, requestedRole: UserRole): Promise<void> => {
    await addDoc(collection(db, 'promotion_requests'), {
        userId: user.uid,
        userName: user.name,
        userBatch: user.batch,
        currentRole: user.role,
        requestedRole: requestedRole,
        status: 'pending',
        createdAt: serverTimestamp()
    });
};

export const getUsersPendingRequest = async (userId: string): Promise<PromotionRequest | null> => {
    const q = query(
        collection(db, 'promotion_requests'),
        where('userId', '==', userId),
        where('status', '==', 'pending'),
        limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as PromotionRequest;
};

export const getSessions = async (): Promise<Session[]> => {
    const q = query(collection(db, 'sessions'), orderBy('eventDate', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
};

export const getSession = async (sessionId: string): Promise<Session | null> => {
    const docRef = doc(db, 'sessions', sessionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Session;
    }
    return null;
};

export const createSession = async (sessionData: Omit<Session, 'id' | 'createdAt' | 'status'>): Promise<void> => {
    const batch = writeBatch(db);
    const newSessionRef = doc(collection(db, 'sessions'));
    batch.set(newSessionRef, {
        ...sessionData,
        createdAt: serverTimestamp(),
        status: 'upcoming'
    });
    const announcementRef = doc(collection(db, 'announcements'));
    batch.set(announcementRef, {
        title: `New ${sessionData.type}: ${sessionData.title}`,
        body: `Join us for our upcoming ${sessionData.type}! Check the sessions page for more details.`,
        createdAt: serverTimestamp()
    });
    await batch.commit();
};

export const updateSession = async (sessionId: string, data: Partial<Session>): Promise<void> => {
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, data);
};

export const deleteSession = async (sessionId: string): Promise<void> => {
    const sessionRef = doc(db, 'sessions', sessionId);
    await deleteDoc(sessionRef);
};