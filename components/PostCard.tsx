import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Post } from '../types.js';
import { useAuth } from '../hooks/useAuth.js';
import { toggleLikePost } from '../services/firebaseService.js';
import RoleBadge from './RoleBadge.js';

// Helper function to extract a YouTube thumbnail URL
const getYouTubeThumbnail = (url: string | undefined): string | null => {
    if (!url) return null;
    let videoId: string | null = null;
    try {
        if (url.includes('youtube.com/watch')) {
            videoId = new URL(url).searchParams.get('v');
        } else if (url.includes('youtu.be/')) {
            videoId = new URL(url).pathname.split('/').pop() || null;
        }
    } catch (e) {
        console.error("Could not parse YouTube URL for thumbnail", e);
        return null;
    }

    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
};

const TypeIcon: React.FC<{ type: 'Text' | 'Image' | 'Video' }> = ({ type }) => {
    let icon;
    switch (type) {
        case 'Text':
            icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>;
            break;
        case 'Image':
            icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
            break;
        case 'Video':
            icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
            break;
    }
    return (
        <div className="absolute top-3 right-3 bg-black/50 p-1.5 rounded-full backdrop-blur-sm z-10">
            {icon}
        </div>
    );
};


const PostCard: React.FC<{ post: Post }> = ({ post }) => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const isLiked = currentUser && post.likes ? post.likes.includes(currentUser.uid) : false;

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if(!currentUser) {
            navigate('/login');
            return;
        }
        await toggleLikePost(post.id, currentUser.uid);
    }
    
    const handleAuthorClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      navigate(`/user/${post.authorId}`);
    };

    const videoThumbnailUrl = getYouTubeThumbnail(post.mediaURL);

    return (
        <Link to={`/post/${post.id}`} className="group relative block bg-black/20 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-400 transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
            <TypeIcon type={post.type} />
            {(post.type === 'Image' && post.mediaURL) && (
                <div className="overflow-hidden aspect-video bg-black">
                    <img src={post.mediaURL} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                </div>
            )}
            {(post.type === 'Video') && (
                <div className="overflow-hidden aspect-video bg-black relative">
                    {videoThumbnailUrl ? (
                        <img src={videoThumbnailUrl} alt={`${post.title} thumbnail`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                        <div className="w-full h-full bg-black flex items-center justify-center text-gray-500">No thumbnail</div>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300">
                        <div className="w-14 h-14 bg-black/50 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                           </svg>
                        </div>
                    </div>
                </div>
            )}
             {post.type === 'Text' && (
                <div className="aspect-video bg-gray-800 flex items-center justify-center p-4">
                     <p className="text-gray-400 text-sm line-clamp-4">{post.description}</p>
                </div>
            )}
            <div className="p-5">
                <div className="flex justify-between items-start text-sm text-gray-400 mb-2">
                    <span>{post.province}</span>
                    <span>{new Date(post.timestamp?.toDate()).toLocaleDateString()}</span>
                </div>
                <h3 className="text-lg font-bold mb-3 text-white group-hover:text-blue-400 transition-colors truncate">{post.title}</h3>
                
                <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                    <div className="cursor-pointer group/author" onClick={handleAuthorClick}>
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                           </div>
                           <div>
                                <p className="font-semibold text-sm group-hover/author:underline text-gray-200">{post.authorName}</p>
                                <RoleBadge role={post.authorRole} />
                           </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={handleLike} className={`flex items-center space-x-1 text-gray-400 hover:text-red-500 transition-colors ${isLiked ? 'text-red-500' : ''}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">{post.likes?.length || 0}</span>
                        </button>
                        <div className="flex items-center space-x-1 text-gray-400">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                               <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">{post.suggestions?.length || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default PostCard;