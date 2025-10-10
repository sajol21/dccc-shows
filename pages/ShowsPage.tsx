import React, { useState, useEffect, useCallback } from 'react';
import { getPosts, createPost } from '../services/firebaseService';
import { Post } from '../types';
import { Province, UserRole, PROVINCES, USER_ROLES } from '../constants';
import PostCard from '../components/PostCard';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import Modal from '../components/Modal';
import { DocumentSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';

const ShowsPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [filters, setFilters] = useState({ province: '', role: '', batch: '' });
  const [isCreatePostModalOpen, setCreatePostModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    setLoading(true);
    setError(null);

    try {
      const lastDoc = reset ? undefined : lastVisible;
      const { posts: newPosts, lastVisible: newLastVisible } = await getPosts(lastDoc, filters);
      
      setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
      setLastVisible(newLastVisible);
      setHasMore(newPosts.length > 0);
    } catch (err: any) {
        console.error("Error fetching posts:", err);
        if (err.code === 'permission-denied') {
            setError("Could not load posts due to insufficient permissions. Please check the database security rules.");
        } else if (err.code === 'failed-precondition') {
            setError("Database query failed: A required index is missing. Using filters may require additional indexes. Check the browser's developer console (F12) for an error message containing a link to create the necessary index in Firebase.");
        } else {
            setError("An unexpected error occurred while fetching posts.");
        }
        setPosts([]);
    } finally {
        setLoading(false);
    }
  }, [loading, hasMore, lastVisible, filters]);

  useEffect(() => {
    setPosts([]);
    setLastVisible(null);
    setHasMore(true);
    fetchPosts(true);
  }, [filters]);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="bg-red-900/50 border border-red-400 text-red-300 px-4 py-3 rounded-xl my-8" role="alert">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{message}</span>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-4xl font-bold">Shows</h1>
        {currentUser && userProfile && (
          userProfile.role !== UserRole.GENERAL_STUDENT ? (
            <button 
              onClick={() => setCreatePostModalOpen(true)} 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              Submit Your Show
            </button>
          ) : (
            <p className="text-sm text-center md:text-right text-gray-400 bg-white/5 dark:bg-black/20 backdrop-blur-lg border border-white/10 px-4 py-2 rounded-lg">
              Only General Members and above can submit shows.
            </p>
          )
        )}
      </div>
      
      {!currentUser && (
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-lg rounded-xl p-8 text-center shadow-lg border border-white/20 mb-8">
            <h2 className="text-2xl font-bold mb-2">Join the Community</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Sign in or create an account to submit your own shows and give feedback.</p>
            <Link to="/login" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105">
                Login or Sign Up
            </Link>
        </div>
      )}


      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-lg p-4 rounded-lg shadow-md mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 border border-white/20">
          <select name="province" value={filters.province} onChange={handleFilterChange} className="w-full p-2 border rounded-md bg-gray-50/10 dark:bg-gray-700/50 border-white/20 dark:border-gray-600">
              <option value="">All Provinces</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select name="role" value={filters.role} onChange={handleFilterChange} className="w-full p-2 border rounded-md bg-gray-50/10 dark:bg-gray-700/50 border-white/20 dark:border-gray-600">
              <option value="">All Roles</option>
              {USER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <input type="text" name="batch" placeholder="Filter by Batch (e.g., 50)" value={filters.batch} onChange={handleFilterChange} className="w-full p-2 border rounded-md bg-gray-50/10 dark:bg-gray-700/50 border-white/20 dark:border-gray-600" />
      </div>
      
      {loading && posts.length === 0 ? (
        <div className="py-8"><Spinner /></div>
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : posts.length > 0 ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => <PostCard key={post.id} post={post} />)}
          </div>

          {loading && <div className="py-8"><Spinner /></div>}

          {!loading && hasMore && (
              <div className="text-center mt-8">
                  <button onClick={() => fetchPosts()} className="px-6 py-3 bg-white/20 dark:bg-gray-700/50 rounded-lg hover:bg-white/30 dark:hover:bg-gray-600/50 backdrop-blur-sm border border-white/10">
                      Load More
                  </button>
              </div>
          )}
        </>
      ) : (
        <p className="text-center text-gray-500 mt-12">No shows found for the selected filters.</p>
      )}
      
      <Modal isOpen={isCreatePostModalOpen} onClose={() => setCreatePostModalOpen(false)} title="Create New Show">
        <CreatePostForm onSuccess={() => {
            setCreatePostModalOpen(false);
            fetchPosts(true);
        }}/>
      </Modal>
    </div>
  );
};

// CreatePostForm component
const CreatePostForm: React.FC<{onSuccess: () => void}> = ({onSuccess}) => {
    const { userProfile } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [province, setProvince] = useState<Province>(Province.CULTURAL);
    const [type, setType] = useState<'Text' | 'Image' | 'Video'>('Text');
    const [file, setFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile) return;

        if (!title || !description) {
            setError('Title and description are required.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await createPost({
                title,
                description,
                province,
                type,
                mediaURL: type === 'Video' ? videoUrl : undefined,
                authorId: userProfile.uid,
                authorName: userProfile.name,
                authorBatch: userProfile.batch,
                authorRole: userProfile.role,
            }, (type === 'Image' && file) ? file : undefined);
            alert("Show submitted for approval!");
            onSuccess();
        } catch (err) {
            console.error(err);
            setError('Failed to create show. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             {error && <p className="text-red-500 bg-red-100 p-2 rounded">{error}</p>}
            <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
            <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
            <select value={province} onChange={e => setProvince(e.target.value as Province)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={type} onChange={e => setType(e.target.value as any)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                <option value="Text">Text</option>
                <option value="Image">Image</option>
                <option value="Video">Video Link</option>
            </select>
            {type === 'Image' && <input type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>}
            {type === 'Video' && <input type="text" placeholder="YouTube/Vimeo URL" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>}
            <button type="submit" disabled={submitting} className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400">
                {submitting ? 'Submitting...' : 'Submit Show'}
            </button>
        </form>
    );
};

export default ShowsPage;