import React from 'react';
import { UserRole } from '../constants';

const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const getRoleClass = () => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-red-500/20 text-red-300';
      case UserRole.EXECUTIVE_MEMBER:
        return 'bg-purple-500/20 text-purple-300';
      case UserRole.LIFETIME_MEMBER:
        return 'bg-yellow-500/20 text-yellow-300';
      case UserRole.ASSOCIATE_MEMBER:
        return 'bg-green-500/20 text-green-300';
      case UserRole.GENERAL_MEMBER:
        return 'bg-blue-500/20 text-blue-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getRoleClass()}`}>
      {role}
    </span>
  );
};

export default RoleBadge;