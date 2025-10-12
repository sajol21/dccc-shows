import React from 'react';
// fix: Changed import to pull from types.ts where Badge is now correctly defined.
import { Badge } from '../types.js';

interface BadgeDetailProps {
  badge: Badge;
  isUnlocked: boolean;
}

const BadgeDetail: React.FC<BadgeDetailProps> = ({ badge, isUnlocked }) => {
  return (
    <div className={`flex items-start gap-4 p-3 rounded-lg transition-all duration-300 ${isUnlocked ? 'bg-gray-700/50' : 'opacity-60'}`}>
      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
        ${isUnlocked
          ? 'bg-yellow-400/20 text-yellow-300'
          : 'bg-gray-700 text-gray-500 grayscale'
        }`}
      >
        {badge.icon}
      </div>
      <div>
        <h4 className={`font-bold ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>{badge.name}</h4>
        <p className="text-sm text-gray-400">{badge.description}</p>
      </div>
    </div>
  );
};

export default BadgeDetail;