import { Timestamp } from 'firebase/firestore';
import { UserRole, Province } from './constants.js';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  batch: string;
  role: UserRole;
  province: Province;
  totalLikes: number;
  submissionsCount: number;
  totalSuggestions: number;
  leaderboardScore: number;
  createdAt: Timestamp;
  readAnnouncements: string[];
  readNotifications: string[];
}

export interface Post {
  id: string;
  title: string;
  description: string;
  type: 'Text' | 'Image' | 'Video';
  mediaURL?: string;
  province: Province;
  authorId: string;
  authorName: string;
  authorBatch: string;
  authorRole: UserRole;
  approved: boolean;
  timestamp: Timestamp;
  likes: string[]; // Array of user UIDs who liked
  suggestions: Suggestion[];
}

export interface Suggestion {
  commenterId: string;
  commenterName: string;
  commenterBatch: string;
  text: string;
  timestamp: Timestamp;
}

export interface PromotionRequest {
  id: string;
  userId: string;
  userName: string;
  userBatch: string;
  currentRole: UserRole;
  requestedRole: UserRole;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
}

export interface ArchivedUser {
    uid: string;
    name: string;
    batch: string;
    role: UserRole;
    leaderboardScore: number;
}

export interface LeaderboardArchive {
    id: string; // YYYY-MM format
    createdAt: Timestamp;
    users: ArchivedUser[];
}

export interface SiteConfig {
    phone: string;
    email: string;
    socials: {
        facebook: string;
        instagram: string;
        youtube: string;
    };
    bannerImageUrl: string;
    bannerLinkUrl: string;
    minRoleToPost: UserRole;
}

export interface Announcement {
    id:string;
    title: string;
    body: string;
    createdAt: Timestamp;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    body: string;
    link?: string;
    read: boolean;
    createdAt: Timestamp;
}

export enum SessionType {
  WORKSHOP = "Workshop",
  SESSION = "Session",
  MEETUP = "Meetup",
}

export interface Session {
  id: string;
  type: SessionType;
  title: string;
  description: string;
  bannerUrl: string;
  linkUrl?: string;
  place?: string;
  eventDate: Timestamp;
  createdAt: Timestamp;
}