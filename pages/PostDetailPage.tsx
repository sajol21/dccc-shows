import React, { useEffect, useState, FormEvent } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getPost, addSuggestion, toggleLikePost, deletePost, updatePost } from '../services/firebaseService';
import { Post } from '../types';
import { PROVINCES, UserRole } from '../constants';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import RoleBadge from '../components/RoleBadge';
import { db } from '../config/firebase';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';

const getEmbedUrl = (url: string | undefined): string => {
    if (!url) return '';
    try {
        if (url.includes('youtube.com/watch')) {
            const videoId = new URL(url).searchParams.get('v');
            return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
        }
        if (url.includes('youtu.be/')) {
            const videoId = new URL(url).pathname.split('/').pop();
            return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
        }
        if (url.includes('vimeo.com/')) {
            const videoId = new URL(url).pathname.split('/').pop();
            return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
        }
    } catch (e) {
        console.error('Error parsing video URL', e);
        return url;
    }
    return url;
};

const ShareButtons: React.FC<{ post: Post }> = ({ post }) => {
    const postUrl = window.location.href;
    const encodedUrl = encodeURIComponent(postUrl);
    const text = `Check out this show: ${post.title}`;
    const encodedText = encodeURIComponent(text);
    const encodedTitle = encodeURIComponent(post.title);
    const summary = post.description.substring(0, 100) + '...';
    const encodedSummary = encodeURIComponent(summary);

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
        linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedSummary}`,
    };

    const openShareWindow = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
    };
    
    return (
        <section className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-center text-gray-300 mb-4">Share this Show</h3>
            <div className="flex justify-center items-center gap-4">
                <button onClick={() => openShareWindow(shareLinks.facebook)} aria-label="Share on Facebook" className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#1877F2] text-white font-bold hover:bg-opacity-90 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /></svg>
                    <span>Facebook</span>
                </button>
                <button onClick={() => openShareWindow(shareLinks.twitter)} aria-label="Share on Twitter" className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#1DA1F2] text-white font-bold hover:bg-opacity-90 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616v.064c0 2.295 1.616 4.22 3.766 4.661-.457.124-.94.19-1.442.19-.304 0-.598-.03-.886-.083.626 1.889 2.443 3.266 4.6 3.306-1.723 1.34-3.89 2.15-6.25 2.15-.407 0-.809-.023-1.205-.072 2.235 1.432 4.896 2.268 7.733 2.268 9.284 0 14.368-7.689 14.368-14.368 0-.218-.005-.436-.014-.652.986-.713 1.84-1.603 2.52-2.61z" /></svg>
                    <span>Twitter</span>
                </button>
                <button onClick={() => openShareWindow(shareLinks.linkedin)} aria-label="Share on LinkedIn" className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#0A66C2] text-white font-bold hover:bg-opacity-90 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                    <span>LinkedIn</span>
                </button>
            </div>
        </section>
    );
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
        if (!id || !currentUser || !post) return;
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


    if (loading) return <Spinner />;
    if (!post) return <p>This show does not exist or has been removed.</p>;
    
    const isOwner = currentUser?.uid === post?.authorId;
    const isAdmin = userProfile?.role === UserRole.ADMIN;
    
    const postDate = post.timestamp?.toDate();
    const formattedDate = postDate ? postDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
    
    const suggestions = post.suggestions?.sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime()) || [];

    return (
      <>
        <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl border border-gray-700 shadow-xl overflow-hidden">
            {post.mediaURL && post.type === 'Image' && <img src={post.mediaURL} alt={post.title} className="w-full h-64 md:h-96 object-cover"/>}
            {post.mediaURL && post.type === 'Video' && (
                <div className="aspect-w-16 aspect-h-9 bg-black">
                    <iframe src={getEmbedUrl(post.mediaURL)} frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={post.title} className="w-full h-full"></iframe>
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

                <div className="bg-black/20 p-6 rounded-lg mb-6 border border-gray-700">
                    <article className="prose prose-invert max-w-none text-lg text-gray-300">
                        <p>{post.description}</p>
                    </article>
                </div>
                
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

                <ShareButtons post={post} />

                <section className="mt-8">
                    <h2 className="text-2xl font-bold mb-4 text-white">Leave Your Mark</h2>
                    {currentUser ? (
                        <form onSubmit={handleSuggestionSubmit} className="mb-6">
                            <textarea value={newSuggestion} onChange={e => setNewSuggestion(e.target.value)} placeholder="Share your wisdom..." rows={3} className="w-full p-2 border rounded-md bg-gray-800 border-gray-600 text-gray-200" />
                            <div className="flex items-center gap-4 mt-2">
                                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Submit</button>
                                {suggestionStatus && <p className="text-sm text-gray-400">{suggestionStatus}</p>}
                            </div>
                        </form>
                    ) : <p>The audience awaits your feedback! <Link to="/login" className="text-blue-400 hover:underline">Log in</Link> to leave a suggestion.</p>}
                    <div className="space-y-4">
                        {suggestions.map((sugg, index) => (
                            <div key={index} className="bg-black/20 p-4 rounded-lg border border-gray-700">
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
                <label>Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white" />
            </div>
            <div>
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white" />
            </div>
            <div>
                <label>Province</label>
                <select name="province" value={formData.province} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white">
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