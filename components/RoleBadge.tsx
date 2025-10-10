import React from 'react';
import { UserRole } from '../constants';

const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const getRoleClass = () => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case UserRole.EXECUTIVE_MEMBER:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case UserRole.LIFETIME_MEMBER:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case UserRole.ASSOCIATE_MEMBER:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case UserRole.GENERAL_MEMBER:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRoleClass()}`}>
      {role}
    </span>
  );
};

export default RoleBadge;
