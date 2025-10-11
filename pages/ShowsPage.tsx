import React, { useState, useEffect } from 'react';
import { getPosts, getSiteConfig, getFeaturedPosts } from '../services/firebaseService.js';
import { Post, SiteConfig } from '../types.js';
import { PROVINCES, ROLE_HIERARCHY } from '../constants.js';
import PostCard from '../components/PostCard.js';
import Spinner from '../components/Spinner.js';
import { useAuth } from '../hooks/useAuth.js';
import { DocumentSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';


const ShowsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [filters, setFilters] = useState({ province: '', type: '', batch: '' });
  const [error, setError] = useState<string | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSideData = async () => {
        const [config, featured] = await Promise.all([getSiteConfig(), getFeaturedPosts()]);
        if (isMounted) {
            setSiteConfig(config);
            setFeaturedPosts(featured);
        }
    };
    fetchSideData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchPostsOnFilter = async () => {
        setLoading(true);
        setError(null);
        try {
            const { posts: newPosts, lastVisible: newLastVisible } = await getPosts(undefined, filters);
            if (isMounted) {
                setPosts(newPosts);
                setLastVisible(newLastVisible);
                setHasMore(newPosts.length > 0);
            }
        } catch (err: any) {
            if (isMounted) {
                console.error("Error fetching posts:", err);
                if (err.code === 'permission-denied') {
                    setError("Could not load posts. The stage lights seem to be off.");
                } else if (err.code === 'failed-precondition') {
                    setError("A database index is needed to perform this filter. An admin can create this via a link in the browser's developer console (F12).");
                } else {
                    setError("An unexpected error occurred while fetching the shows.");
                }
                setPosts([]);
            }
        } finally {
            if (isMounted) {
                setLoading(false);
            }
        }
    };
    
    fetchPostsOnFilter();

    return () => { isMounted = false; };
  }, [filters]);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLoadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const { posts: newPosts, lastVisible: newLastVisible } = await getPosts(lastVisible, filters);
      setPosts(prev => [...prev, ...newPosts]);
      setLastVisible(newLastVisible);
      setHasMore(newPosts.length > 0);
    } catch (err) {
       console.error("Error fetching more posts:", err);
       setError("Failed to load more shows.");
    } finally {
        setLoading(false);
    }
  };

  const Alert: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center text-red-400 bg-red-900/50 p-3 my-4 rounded-md" role="alert">
      <strong className="font-bold">Oops! </strong>
      <span className="block sm:inline">{message}</span>
    </div>
  );
  
  const canPost = userProfile && siteConfig && ROLE_HIERARCHY[userProfile.role] >= ROLE_HIERARCHY[siteConfig.minRoleToPost];

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-4xl font-bold">The Grand Stage</h1>
        {userProfile && siteConfig && (
          canPost ? (
            <Link 
              to="/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              Submit Your Show
            </Link>
          ) : (
            <p className="text-sm text-center md:text-right text-gray-400 bg-gray-800/70 backdrop-blur-lg border border-gray-700 px-4 py-2 rounded-lg">
              Your time to shine is coming! Only {siteConfig.minRoleToPost}s and above can post.
            </p>
          )
        )}
      </div>
      
      {!userProfile && (
        <div className="bg-gray-800/70 backdrop-blur-lg rounded-xl p-8 text-center shadow-lg border border-gray-700 mb-8">
            <h2 className="text-2xl font-bold mb-2">The Audience Awaits</h2>
            <p className="text-gray-400 mb-4">Sign in or create an account to share your masterpiece and join the conversation.</p>
            <Link to="/login" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105">
                Take the Stage
            </Link>
        </div>
      )}

      {featuredPosts.length > 0 && (
          <section className="mb-12">
              <h2 className="text-3xl font-bold text-center mb-6">Featured Shows</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredPosts.map(post => <PostCard key={post.id} post={post} />)}
              </div>
          </section>
      )}

      <div className="bg-gray-800/70 backdrop-blur-lg p-4 rounded-lg shadow-md mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 border border-gray-700">
          <select name="province" value={filters.province} onChange={handleFilterChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-gray-200">
              <option value="">All Provinces</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select name="type" value={filters.type} onChange={handleFilterChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-gray-200">
              <option value="">All Types</option>
              <option value="Text">Text</option>
              <option value="Image">Image</option>
              <option value="Video">Video</option>
          </select>
          <input type="text" name="batch" placeholder="Filter by Batch (e.g., 27)" value={filters.batch} onChange={handleFilterChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-gray-200" />
      </div>
      
      {loading && posts.length === 0 ? (
        <div className="py-8"><Spinner /></div>
      ) : error ? (
        <Alert message={error} />
      ) : posts.length > 0 ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => <PostCard key={post.id} post={post} />)}
          </div>

          {loading && <div className="py-8"><Spinner /></div>}

          {!loading && hasMore && (
              <div className="text-center mt-8">
                  <button onClick={handleLoadMore} className="px-6 py-3 bg-gray-700 text-white backdrop-blur-sm border border-gray-600 rounded-lg hover:bg-gray-600">
                      Encore! (Load More)
                  </button>
              </div>
          )}
        </>
      ) : (
        <p className="text-center text-gray-400 mt-12">The stage is empty... be the first to shine!</p>
      )}
    </div>
  );
};

export default ShowsPage;