import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Post } from '../types';
import { useAuth } from '../hooks/useAuth';
import { toggleLikePost } from '../services/firebaseService';
import RoleBadge from './RoleBadge';

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
        <Link to={`/post/${post.id}`} className="group block bg-black/20 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg hover:shadow-xl hover:border-white/20 transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
            {post.type === 'Image' && post.mediaURL && (
                <div className="overflow-hidden aspect-video bg-black">
                    <img src={post.mediaURL} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                </div>
            )}
            {post.type === 'Video' && (
                <div className="overflow-hidden aspect-video bg-black relative">
                    {videoThumbnailUrl ? (
                        <img src={videoThumbnailUrl} alt={`${post.title} thumbnail`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                        <div className="w-full h-full bg-black" />
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300">
                        <div className="w-14 h-14 bg-black/50 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors">
                           <svg xmlns="http://www.w.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                           </svg>
                        </div>
                    </div>
                </div>
            )}
            <div className="p-6">
                <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
                    <span>{post.province}</span>
                    <span>{new Date(post.timestamp?.toDate()).toLocaleDateString()}</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">{post.title}</h3>
                <p className="text-gray-300 truncate">{post.description}</p>
                <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                    <div className="cursor-pointer" onClick={handleAuthorClick}>
                        <div className="flex items-center gap-2">
                           <p className="font-semibold text-sm hover:underline text-gray-200">{post.authorName}</p>
                           <RoleBadge role={post.authorRole} />
                        </div>
                        <p className="text-xs text-gray-400">Batch {post.authorBatch}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={handleLike} className={`flex items-center space-x-1 text-gray-400 hover:text-red-500 transition-colors ${isLiked ? 'text-red-500' : ''}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            <span>{post.likes?.length || 0}</span>
                        </button>
                        <div className="flex items-center space-x-1 text-gray-400">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm2 1v8h12V6H4zm3 3h6v2H7V9z" />
                            </svg>
                            <span>{post.suggestions?.length || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default PostCard;