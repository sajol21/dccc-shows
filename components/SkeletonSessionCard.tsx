import React from 'react';

const SkeletonSessionCard: React.FC = () => {
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
                <div className="h-4 rounded w-3/4 mb-2" style={skeletonPatternStyle}></div>
                <div className="h-6 rounded w-full mb-3" style={skeletonPatternStyle}></div>
                <div className="space-y-2">
                    <div className="h-3 rounded w-full" style={skeletonPatternStyle}></div>
                    <div className="h-3 rounded w-5/6" style={skeletonPatternStyle}></div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonSessionCard;