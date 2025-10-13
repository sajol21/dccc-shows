import React from 'react';

const SkeletonPostCard: React.FC = () => {
    const imagePlaceholderStyle = {
        backgroundColor: 'rgba(17, 24, 39, 1)', // gray-900
        backgroundImage: `url('https://res.cloudinary.com/dabfeqgsj/image/upload/v1759850540/re04d3ncwpwk75wllsfh.png')`,
        backgroundSize: '18rem',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
    };
    const skeletonPatternStyle = {
        backgroundColor: 'rgba(55, 65, 81, 1)', // gray-700
        backgroundImage: `url('https://res.cloudinary.com/dabfeqgsj/image/upload/c_scale,o_10,w_40/v1759850540/re04d3ncwpwk75wllsfh.png')`,
        backgroundRepeat: 'repeat',
    };

    return (
        <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg overflow-hidden animate-pulse">
            <div className="aspect-video" style={imagePlaceholderStyle}></div>
            <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <div className="h-4 rounded w-1/4" style={skeletonPatternStyle}></div>
                    <div className="h-4 rounded w-1/4" style={skeletonPatternStyle}></div>
                </div>
                <div className="h-6 rounded w-3/4 mb-3" style={skeletonPatternStyle}></div>
                
                <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-full" style={skeletonPatternStyle}></div>
                       <div>
                            <div className="h-4 rounded w-24 mb-1" style={skeletonPatternStyle}></div>
                            <div className="h-3 rounded w-16" style={skeletonPatternStyle}></div>
                       </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="h-5 rounded w-10" style={skeletonPatternStyle}></div>
                        <div className="h-5 rounded w-10" style={skeletonPatternStyle}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonPostCard;