import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPosts, getSiteConfig } from '../services/firebaseService.js';
import { Post, SiteConfig } from '../types.js';
import PostCard from '../components/PostCard.js';
import SkeletonPostCard from '../components/SkeletonPostCard.js';

type PostTypeFilter = 'All' | 'Text' | 'Image' | 'Video';

const HomePage: React.FC = () => {
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<PostTypeFilter>('All');
  const [quickCreateTitle, setQuickCreateTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const filterOptions: { type?: 'Text' | 'Image' | 'Video' } = {};
        if (activeFilter !== 'All') {
            // FIX: Corrected typo from 'active-filter' to 'activeFilter'.
            filterOptions.type = activeFilter;
        }

        const [{ posts }, config] = await Promise.all([
            getPosts(undefined, filterOptions),
            getSiteConfig()
        ]);

        if (isMounted) {
            setLatestPosts(posts.slice(0, 6)); // show latest 6
            setSiteConfig(config);
        }
      } catch (err: any) {
        if (isMounted) {
            console.error("Error fetching homepage data:", err);
            if (err.code === 'permission-denied') {
              setError("Could not load data due to insufficient permissions. An administrator needs to configure the database security rules to allow public access to posts and user profiles.");
            } else if (err.code === 'failed-precondition') {
              setError("Database query failed: A required index is missing. Check the browser's developer console (F12) for an error message containing a link to create the index in Firebase.");
            } else {
              setError("An unexpected error occurred while fetching data.");
            }
        }
      } finally {
        if (isMounted) {
            setLoading(false);
        }
      }
    };
    fetchData();

    return () => {
        isMounted = false;
    };
  }, [activeFilter]);

  const handleQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/create', { state: { title: quickCreateTitle } });
  };

  const FilterButton: React.FC<{ filter: PostTypeFilter }> = ({ filter }) => (
    <button
      onClick={() => setActiveFilter(filter)}
      className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 transform hover:scale-105
      ${activeFilter === filter
        ? 'bg-blue-600 text-white shadow-lg'
        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {filter}
    </button>
  );

  const Alert: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center text-red-400 bg-red-900/50 p-3 my-4 rounded-md" role="alert">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{message}</span>
    </div>
  );

  return (
    <div className="space-y-16 animate-fade-in">
      {/* Welcome Banner */}
      <section className="bg-gradient-to-br from-blue-600/50 to-indigo-700/50 backdrop-blur-lg text-white rounded-xl p-16 text-center shadow-2xl shadow-blue-500/20 border border-white/20">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">Welcome to DCCC</h1>
        <p className="text-lg md:text-xl max-w-3xl mx-auto">
          The official platform for the Dhaka College Cultural Club. Share your creativity, get feedback, and climb the ranks!
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/shows" className="inline-block bg-white text-blue-600 font-bold py-3 px-6 rounded-lg hover:bg-gray-200 transition duration-300 transform hover:scale-105">
              Explore Shows
            </Link>
            <Link to="/leaderboard" className="inline-block bg-transparent border-2 border-white text-white font-bold py-3 px-6 rounded-lg hover:bg-white/20 transition duration-300 transform hover:scale-105">
              See Leaders
            </Link>
        </div>
      </section>

      {/* Quick Create */}
      <section className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-blue-900/20 border border-blue-500/20">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 text-white">Have Something to Share?</h2>
            <p className="text-gray-300 mb-6 max-w-xl mx-auto">Join our community of creators and showcase your talent.</p>
          </div>
          <form onSubmit={handleQuickCreate} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <input 
                type="text"
                value={quickCreateTitle}
                onChange={(e) => setQuickCreateTitle(e.target.value)}
                placeholder="What's the title of your show?"
                className="flex-grow w-full px-4 py-3 border rounded-lg bg-gray-900/50 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
              />
              <button 
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50 whitespace-nowrap"
                disabled={!quickCreateTitle.trim()}
              >
                Start Creating
              </button>
          </form>
      </section>

      {/* Admin-configurable Banner */}
      {siteConfig?.bannerImageUrl && (
        <section>
          <a href={siteConfig.bannerLinkUrl} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
            <img src={siteConfig.bannerImageUrl} alt="Promotional Banner" className="w-full object-cover"/>
          </a>
        </section>
      )}

       {/* Latest Works */}
      <section>
        <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Latest Shows</h2>
            <p className="text-gray-400 mt-2">See what's new on the grand stage.</p>
        </div>
        <div className="flex justify-center items-center gap-2 md:gap-4 mb-8">
          <FilterButton filter="All" />
          <FilterButton filter="Text" />
          <FilterButton filter="Image" />
          <FilterButton filter="Video" />
        </div>
        
        {error ? (
            <Alert message={error} />
        ) : loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonPostCard key={index} />
              ))}
            </div>
        ) : latestPosts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
            <p className="text-center text-gray-500 mt-12">The stage is quiet for this category. Try another!</p>
        )}
      </section>

    </div>
  );
};

export default HomePage;