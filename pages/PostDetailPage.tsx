import React, { useEffect, useState, FormEvent } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getPost, addSuggestion, toggleLikePost, deletePost, updatePost } from '../services/firebaseService.js';
import { Post } from '../types.js';
import { PROVINCES, UserRole } from '../constants.js';
import { useAuth } from '../contexts/AuthContext.js';
import Modal from '../components/Modal.js';
import RoleBadge from '../components/RoleBadge.js';
import { db } from '../config/firebase.js';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';

const getEmbedUrl = (url: string | undefined, autoplay: boolean = false): string => {
    if (!url) return '';
    try {
        if (url.includes('youtube.com/watch')) {
            const videoId = new URL(url).searchParams.get('v');
            return videoId ? `https://www.youtube.com/embed/${videoId}${autoplay ? '?autoplay=1' : ''}` : url;
        }
        if (url.includes('youtu.be/')) {
            const videoId = new URL(url).pathname.split('/').pop();
            return videoId ? `https://www.youtube.com/embed/${videoId}${autoplay ? '?autoplay=1' : ''}` : url;
        }
        if (url.includes('vimeo.com/')) {
            const videoId = new URL(url).pathname.split('/').pop();
            return videoId ? `https://player.vimeo.com/video/${videoId}${autoplay ? '?autoplay=1' : ''}` : url;
        }
        if (url.includes('facebook.com/') || url.includes('fb.watch')) {
            return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=auto${autoplay ? '&autoplay=true' : ''}`;
        }
    } catch (e) {
        console.error('Error parsing video URL', e);
        return url;
    }
    return url;
};

const PostDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const [post, setPost] = useState<Post | null>(null);
    const [newSuggestion, setNewSuggestion] = useState('');
    const [suggestionStatus, setSuggestionStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [lightboxMedia, setLightboxMedia] = useState<{type: 'Image' | 'Video', url: string} | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);

        const postRef = doc(db, 'posts', id);
        const unsubscribe = onSnapshot(postRef, (docSnap) => {
            if (docSnap.exists()) {
                const postData = { id: docSnap.id, ...docSnap.data() } as Post;
                setPost(postData);
                if (currentUser) {
                    setIsLiked((postData.likes || []).includes(currentUser.uid));
                }
            } else {
                setPost(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching post:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id, currentUser]);


    const handleSuggestionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !userProfile || !newSuggestion.trim()) return;
        setSuggestionStatus('Submitting...');
        try {
            await addSuggestion(
                id,
                {
                    commenterId: userProfile.uid,
                    commenterName: userProfile.name,
                    commenterBatch: userProfile.batch,
                    text: newSuggestion,
                }
            );
            setNewSuggestion('');
            setSuggestionStatus('Suggestion posted!');
            setTimeout(() => setSuggestionStatus(''), 3000);
        } catch (error) {
            console.error("Failed to post suggestion:", error);
            setSuggestionStatus('Failed to post. Please check permissions and try again.');
        }
    };

    const handleLike = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        if (!id || !post) return;
        
        // Optimistic update for UI responsiveness
        const newLikedStatus = !isLiked;
        const currentLikes = post.likes || [];
        const newLikes = newLikedStatus 
            ? [...currentLikes, currentUser.uid]
            : currentLikes.filter(uid => uid !== currentUser.uid);

        setPost(prev => prev ? {...prev, likes: newLikes} : null);
        setIsLiked(newLikedStatus);
        
        // Call firebase service
        await toggleLikePost(id, currentUser.uid);
    };

    const handleDelete = async () => {
        if (!post) return;
        if (window.confirm('Are you sure you want to permanently delete this post?')) {
            try {
                await deletePost(post);
                alert('Post deleted successfully.');
                navigate('/shows');
            } catch (err) {
                console.error(err);
                alert('Failed to delete post. Please try again.');
            }
        }
    };

    const suggestionTimestampToDateString = (timestamp: Timestamp | { toDate: () => Date }): string => {
        if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toLocaleString();
        }
        return 'Just now'; // Fallback for optimistic updates
    };


    if (loading) {
        return (
            <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl border border-gray-700 shadow-xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-700"></div>
                <div className="p-6 md:p-10">
                    <div className="h-8 bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="flex items-center gap-2 mb-2">
                         <div className="h-5 bg-gray-700 rounded w-1/4"></div>
                         <div className="h-4 bg-gray-700 rounded w-1/5"></div>
                    </div>
                    <div className="h-4 bg-gray-700 rounded w-1/3 mb-6"></div>
                    
                    <div className="py-4 border-t border-b border-gray-700 flex gap-6">
                        <div className="h-6 bg-gray-700 rounded w-24"></div>
                        <div className="h-6 bg-gray-700 rounded w-28"></div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-700">
                        <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
                        <div className="h-20 bg-gray-700 rounded w-full"></div>
                    </div>
                </div>
            </div>
        );
    }
    
    if (!post) return <p>This show does not exist or has been removed.</p>;
    
    const isOwner = currentUser?.uid === post?.authorId;
    const isAdmin = userProfile?.role === UserRole.ADMIN;
    
    const postDate = post.timestamp?.toDate();
    const formattedDate = postDate ? postDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
    
    const suggestions = post.suggestions?.sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime()) || [];

    return (
      <>
        <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl border border-gray-700 shadow-xl overflow-hidden animate-fade-in">
            {post.mediaURL && post.type === 'Image' && 
                <div className="bg-black">
                    <img 
                        src={post.mediaURL} 
                        alt={post.title} 
                        className="w-full aspect-square object-contain mx-auto cursor-pointer"
                        onClick={() => setLightboxMedia({ type: 'Image', url: post.mediaURL || '' })}
                    />
                </div>
            }
            {post.mediaURL && post.type === 'Video' && (
                <div 
                    className="aspect-video bg-black cursor-pointer group relative"
                    onClick={() => setLightboxMedia({ type: 'Video', url: getEmbedUrl(post.mediaURL, true) })}
                >
                    <iframe src={getEmbedUrl(post.mediaURL)} frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={post.title} className="w-full h-full pointer-events-none"></iframe>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" ></path></svg>
                    </div>
                </div>
            )}
            
            <div className="p-6 md:p-10 text-gray-200">
                <header className="mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-white">{post.title}</h1>
                    <div className="flex-shrink-0 flex gap-2">
                        {(isOwner || isAdmin) && (
                            <button onClick={handleDelete} className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700">DELETE</button>
                        )}
                        {isAdmin && (
                            <button onClick={() => setEditModalOpen(true)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700">EDIT</button>
                        )}
                    </div>
                </header>

                {post.type === 'Text' && (
                    <div className="bg-black/20 p-6 rounded-lg mb-6 border border-gray-700">
                        <article className="prose prose-invert max-w-none text-lg text-gray-300">
                            <p>{post.description}</p>
                        </article>
                    </div>
                )}
                
                <div className="text-sm text-gray-400 space-y-2 mb-6">
                    <div className="flex items-center gap-2">
                        <Link to={`/user/${post.authorId}`} className="font-semibold hover:underline text-gray-200">{post.authorName}</Link>
                        <RoleBadge role={post.authorRole} />
                    </div>
                    <p><strong>Batch:</strong> HSC - {post.authorBatch}</p>
                    <p><strong>Date:</strong> {formattedDate}</p>
                </div>


                <div className="flex items-center space-x-6 py-4 border-t border-gray-700">
                    <button onClick={handleLike} className={`flex items-center space-x-2 text-lg font-semibold transition-colors ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                        <span>{(post.likes || []).length} Likes</span>
                    </button>
                    <div className="flex items-center space-x-2 text-lg text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm2 1v8h12V6H4zm3 3h6v2H7V9z" /></svg>
                        <span>{suggestions.length} Suggestions</span>
                    </div>
                </div>

                <section className="mt-6 pt-6 border-t border-gray-700">
                    <h2 className="text-2xl font-bold mb-4 text-white">Leave Your Mark</h2>
                    {currentUser ? (
                        <form onSubmit={handleSuggestionSubmit} className="mb-6">
                            <textarea value={newSuggestion} onChange={e => setNewSuggestion(e.target.value)} placeholder="Share your wisdom..." rows={3} className="w-full p-2 border rounded-md bg-gray-800 border-gray-600 text-gray-200" />
                            <div className="flex items-center gap-4 mt-2">
                                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Submit</button>
                                {suggestionStatus && <p className={`text-sm ${suggestionStatus.startsWith('Failed') ? 'text-red-400' : 'text-green-400'}`}>{suggestionStatus}</p>}
                            </div>
                        </form>
                    ) : <p>The audience awaits your feedback! <Link to="/login" className="text-blue-400 hover:underline">Log in</Link> to leave a suggestion.</p>}
                    <div className="space-y-4">
                        {suggestions.map((sugg) => (
                            <div key={`${sugg.commenterId}-${sugg.timestamp.toDate().getTime()}`} className="bg-black/20 p-4 rounded-lg border border-gray-700">
                                <p className="mb-2 text-gray-300">{sugg.text}</p>
                                <div className="text-xs text-gray-500">
                                    <span>{sugg.commenterName} (Batch {sugg.commenterBatch})</span> - <span>{suggestionTimestampToDateString(sugg.timestamp)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
        <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Post">
            <EditPostForm post={post} onSuccess={() => { setEditModalOpen(false); }} />
        </Modal>
        {lightboxMedia && (
            <div 
                className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 cursor-pointer"
                onClick={() => setLightboxMedia(null)}
            >
                {lightboxMedia.type === 'Image' && (
                     <img 
                        src={lightboxMedia.url} 
                        alt="Full screen view" 
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                )}
                {lightboxMedia.type === 'Video' && (
                    <div className="aspect-video w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
                        <iframe src={lightboxMedia.url} frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={post.title} className="w-full h-full"></iframe>
                    </div>
                )}
            </div>
        )}
      </>
    );
};

// Edit Post Form Component
const EditPostForm: React.FC<{ post: Post, onSuccess: () => void }> = ({ post, onSuccess }) => {
    const [formData, setFormData] = useState({ title: post.title, description: post.description, province: post.province });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await updatePost(post.id, formData);
            alert('Post updated successfully!');
            onSuccess();
        } catch (err) {
            console.error(err);
            alert('Failed to update post.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-gray-200">
            <div>
                <label htmlFor="edit-title" className="block text-sm font-medium mb-1">Title</label>
                <input id="edit-title" type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white" />
            </div>
            <div>
                <label htmlFor="edit-description" className="block text-sm font-medium mb-1">Description</label>
                <textarea id="edit-description" name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white" />
            </div>
            <div>
                <label htmlFor="edit-province" className="block text-sm font-medium mb-1">Province</label>
                <select id="edit-province" name="province" value={formData.province} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white">
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            <button type="submit" disabled={submitting} className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400">
                {submitting ? 'Saving...' : 'Save Changes'}
            </button>
        </form>
    );
};

export default PostDetailPage;