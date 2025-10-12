import React from 'react';

const SkeletonPostCard: React.FC = () => {
    return (
        <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg overflow-hidden animate-pulse">
            <div className="aspect-video bg-gray-700"></div>
            <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                </div>
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
                
                <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-full bg-gray-700"></div>
                       <div>
                            <div className="h-4 bg-gray-700 rounded w-24 mb-1"></div>
                            <div className="h-3 bg-gray-700 rounded w-16"></div>
                       </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="h-5 bg-gray-700 rounded w-10"></div>
                        <div className="h-5 bg-gray-700 rounded w-10"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonPostCard;
