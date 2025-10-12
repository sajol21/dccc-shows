import React from 'react';
// fix: Removed Badge from this import as it will be defined in this file.
import { UserProfile } from './types.js';

// fix: Added exported Badge interface.
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  condition: (user: UserProfile) => boolean;
}

// FIX: Replaced JSX with React.createElement to avoid syntax errors in a .ts file.
export const ALL_BADGES: Badge[] = [
  {
    id: 'first_show',
    name: 'Curtain Raiser',
    description: 'Awarded for submitting your first show.',
    icon: React.createElement("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      className: "h-10 w-10",
      viewBox: "0 0 20 20",
      fill: "currentColor"
    }, React.createElement("path", {
      d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
    })),
    condition: (user) => user.submissionsCount >= 1,
  },
  {
    id: 'prolific_creator',
    name: 'Prolific Creator',
    description: 'Awarded for submitting 10 or more shows.',
    icon: React.createElement("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      className: "h-10 w-10",
      viewBox: "0 0 20 20",
      fill: "currentColor"
    }, React.createElement("path", {
      d: "M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM2 15a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z"
    })),
    condition: (user) => user.submissionsCount >= 10,
  },
  {
    id: 'helpful_critic',
    name: 'Helpful Critic',
    description: 'Awarded for making 25 or more suggestions.',
    icon: React.createElement("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      className: "h-10 w-10",
      viewBox: "0 0 20 20",
      fill: "currentColor"
    }, React.createElement("path", {
      fillRule: "evenodd",
      d: "M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z",
      clipRule: "evenodd"
    })),
    condition: (user) => user.totalSuggestions >= 25,
  },
  {
    id: 'fan_favorite',
    name: 'Fan Favorite',
    description: 'Awarded for receiving 100 or more likes across all shows.',
    icon: React.createElement("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      className: "h-10 w-10",
      viewBox: "0 0 20 20",
      fill: "currentColor"
    }, React.createElement("path", {
      fillRule: "evenodd",
      d: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z",
      clipRule: "evenodd"
    })),
    condition: (user) => user.totalLikes >= 100,
  },
];

export const getEarnedBadges = (user: UserProfile): Badge[] => {
  if (!user) return [];
  return ALL_BADGES.filter(badge => badge.condition(user));
};