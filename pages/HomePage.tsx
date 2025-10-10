import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPosts, getLeaderboardUsers, getSiteConfig } from '../services/firebaseService';
import { Post, UserProfile, SiteConfig } from '../types';
import PostCard from '../components/PostCard';
import Spinner from '../components/Spinner';

const HomePage: React.FC = () => {
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [{ posts }, topUsers, config] = await Promise.all([
            getPosts(undefined, {}),
            getLeaderboardUsers(),
            getSiteConfig()
        ]);
        setLatestPosts(posts.slice(0, 6)); // show latest 6
        setLeaderboard(topUsers.slice(0, 5)); // show top 5
        setSiteConfig(config);
      } catch (err: any) {
        console.error("Error fetching homepage data:", err);
        if (err.code === 'permission-denied') {
          setError("Could not load data due to insufficient permissions. An administrator needs to configure the database security rules to allow public access to posts and user profiles.");
        } else if (err.code === 'failed-precondition') {
          setError("Database query failed: A required index is missing. Check the browser's developer console (F12) for an error message containing a link to create the index in Firebase.");
        } else {
          setError("An unexpected error occurred while fetching data.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const Alert: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center text-red-400 bg-red-900/50 p-3 my-4 rounded-md" role="alert">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{message}</span>
    </div>
  );

  return (
    <div className="space-y-12">
      {/* Welcome Banner */}
      <section className="bg-gradient-to-br from-blue-600/50 to-indigo-700/50 backdrop-blur-lg text-white rounded-xl p-12 text-center shadow-2xl shadow-blue-500/20 border border-white/20">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Welcome to DCCC</h1>
        <p className="text-lg md:text-xl max-w-3xl mx-auto">
          The official platform for the Dhaka College Cultural Club. Share your creativity, get feedback, and climb the ranks!
        </p>
        <Link to="/shows" className="mt-8 inline-block bg-white text-blue-600 font-bold py-3 px-6 rounded-lg hover:bg-gray-200 transition duration-300 transform hover:scale-105">
          Explore Shows
        </Link>
      </section>

      {loading ? (
        <Spinner />
      ) : error ? (
        <Alert message={error} />
      ) : (
        <>
          {/* Admin-configurable Banner */}
          {siteConfig?.bannerImageUrl && (
            <section>
              <a href={siteConfig.bannerLinkUrl} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
                <img src={siteConfig.bannerImageUrl} alt="Promotional Banner" className="w-full object-cover"/>
              </a>
            </section>
          )}

          {/* Leaderboard Preview */}
          <section>
            <h2 className="text-3xl font-bold text-center mb-6">Top Performers</h2>
              <div className="bg-white/10 dark:bg-black/20 backdrop-blur-lg rounded-xl border border-white/20 p-6 shadow-lg">
                <ul className="space-y-4">
                  {leaderboard.map((user, index) => (
                    <li key={user.uid} className="flex items-center justify-between p-3 rounded-md transition-colors hover:bg-white/10 dark:hover:bg-white/5">
                      <div className="flex items-center space-x-4">
                        <span className="text-lg font-bold text-gray-400">{index + 1}</span>
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.role} - Batch {user.batch}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className="font-bold text-blue-400">{user.leaderboardScore} Score</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="text-center mt-4">
                    <Link to="/leaderboard" className="text-blue-400 hover:underline">View Full Leaderboard</Link>
                </div>
              </div>
          </section>

           {/* Call to Action */}
            <section className="bg-white/10 dark:bg-black/20 backdrop-blur-lg rounded-xl p-8 text-center shadow-lg border border-white/20">
                <h2 className="text-2xl font-bold mb-2">Have Something to Share?</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Join our community of creators and showcase your talent.</p>
                <Link to="/shows" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105">
                    Submit Your Show
                </Link>
            </section>

          {/* Latest Works */}
          <section>
            <h2 className="text-3xl font-bold text-center mb-6">Latest Shows</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {latestPosts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
          </section>
        </>
      )}
    </div>
  );
};

export default HomePage;