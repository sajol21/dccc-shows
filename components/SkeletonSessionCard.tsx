import React from 'react';

const SkeletonSessionCard: React.FC = () => {
    return (
        <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg overflow-hidden animate-pulse">
            <div className="aspect-video bg-gray-700"></div>
            <div className="p-5">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-700 rounded w-full mb-3"></div>
                <div className="space-y-2">
                    <div className="h-3 bg-gray-700 rounded w-full"></div>
                    <div className="h-3 bg-gray-700 rounded w-5/6"></div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonSessionCard;
