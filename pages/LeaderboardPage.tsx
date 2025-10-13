import React, { useEffect, useState } from 'react';
import { onLeaderboardUpdate, getLeaderboardArchives, getArchivedLeaderboard, getBestPostForUserInMonth } from '../services/firebaseService.js';
import { UserProfile, LeaderboardArchive, ArchivedUser, Post } from '../types.js';
import RoleBadge from '../components/RoleBadge.js';
import SEO from '../components/SEO.js';
import Modal from '../components/Modal.js';
import Spinner from '../components/Spinner.js';
import PostCard from '../components/PostCard.js';
import { Unsubscribe } from 'firebase/firestore';

type LeaderboardView = 'current' | string; // 'current' or an archive ID like '2024-07'

const SkeletonLeaderboardRow: React.FC = () => {
    const skeletonPatternStyle = {
        backgroundColor: 'rgba(55, 65, 81, 1)', // gray-700
        backgroundImage: `url('https://res.cloudinary.com/dabfeqgsj/image/upload/c_scale,o_10,w_40/v1759850540/re04d3ncwpwk75wllsfh.png')`,
        backgroundRepeat: 'repeat',
    };
    return (
    <div className="p-4 rounded-lg flex items-center gap-4 bg-gray-800/50 animate-pulse border border-gray-700">
        <div className="w-10">
            <div className="h-6 w-6 rounded" style={skeletonPatternStyle}></div>
        </div>
        <div className="flex-grow">
            <div className="h-5 rounded w-3/5 mb-2" style={skeletonPatternStyle}></div>
            <div className="h-4 rounded w-2/5" style={skeletonPatternStyle}></div>
        </div>
        <div className="text-right">
            <div className="h-6 rounded w-12" style={skeletonPatternStyle}></div>
        </div>
    </div>
)};

const LeaderboardPage: React.FC = () => {
  const [users, setUsers] = useState<(UserProfile | ArchivedUser)[]>([]);
  const [archives, setArchives] = useState<{ id: string }[]>([]);
  const [view, setView] = useState<LeaderboardView>('current');
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Current Leaderboard');

  const [modalLoading, setModalLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bestPost, setBestPost] = useState<Post | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
        try {
            const archiveList = await getLeaderboardArchives();
            if (isMounted) {
                setArchives(archiveList);
            }
        } catch (error) {
            console.error("Could not fetch leaderboard archives:", error);
        }
    };
    fetchInitialData();

    return () => {
        isMounted = false;
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    let unsubscribe: Unsubscribe | null = null;

    if (view === 'current') {
        setTitle('Current Leaderboard');
        unsubscribe = onLeaderboardUpdate((userList) => {
            setUsers(userList);
            setLoading(false);
        });
    } else {
        const fetchArchive = async () => {
            try {
                const archiveData = await getArchivedLeaderboard(view);
                if (archiveData && archiveData.users) {
                    // Sort archived users for consistency
                    archiveData.users.sort((a, b) => {
                        if (a.leaderboardScore !== b.leaderboardScore) {
                            return b.leaderboardScore - a.leaderboardScore;
                        }
                        return a.name.localeCompare(b.name);
                    });
                }
                setTitle(`Leaderboard: ${view}`);
                setUsers(archiveData ? archiveData.users : []);
            } catch (error) {
                console.error("Failed to fetch leaderboard archive:", error);
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };
        fetchArchive();
    }

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [view]);
  
  const handleUserClick = async (user: UserProfile | ArchivedUser) => {
    setIsModalOpen(true);
    setModalLoading(true);
    setBestPost(null);

    let yearMonth: string;
    if (view === 'current') {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        yearMonth = `${year}-${month}`;
    } else {
        yearMonth = view;
    }

    try {
        const post = await getBestPostForUserInMonth(user.uid, yearMonth);
        setBestPost(post);
    } catch (error) {
        console.error("Failed to fetch best post:", error);
        setBestPost(null);
    } finally {
        setModalLoading(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <SEO
        title={`${title} | DCCC`}
        description="See the top-performing members of the Dhaka College Cultural Club. Rankings are based on likes and suggestions received on their shows."
        keywords="leaderboard, top members, DCCC ranks, student competition"
      />
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-white">{title}</h1>
        <p className="text-gray-400 mt-2">Top performers based on likes and suggestions received.</p>
      </div>

      <div className="mb-6">
        <select 
          value={view} 
          onChange={(e) => setView(e.target.value as LeaderboardView)}
          className="w-full max-w-xs mx-auto block p-2 border rounded-md bg-gray-700 border-gray-600 text-white"
        >
          <option value="current">Current Leaderboard</option>
          {archives.map(archive => (
            <option key={archive.id} value={archive.id}>
              Archive: {archive.id}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => <SkeletonLeaderboardRow key={index} />)}
        </div>
      ) : users.length === 0 ? (
        <p className="text-center text-gray-500 mt-12">No data available for this period.</p>
      ) : (
        <div className="space-y-4">
          {users.map((user, index) => (
            <button
              key={user.uid} 
              onClick={() => handleUserClick(user)}
              className={`w-full p-4 rounded-lg flex items-center gap-4 transition-all duration-300 shadow-sm border bg-[#161b22] border-gray-800 text-left hover:border-blue-500 hover:bg-gray-800/50
              ${index === 0 ? 'md:bg-yellow-900/50 md:border-yellow-400' : ''}
              ${index === 1 ? 'md:bg-gray-700/50 md:border-gray-400' : ''}
              ${index === 2 ? 'md:bg-orange-900/50 md:border-orange-400' : ''}
              `}
            >
              <div className="text-2xl font-bold w-10 text-center text-gray-400">
                {index + 1}
              </div>
              <div className="flex-grow min-w-0">
                <p className="font-bold text-lg text-white truncate mb-1">{user.name}</p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Batch {user.batch}</span>
                    <RoleBadge role={user.role} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-400">{user.leaderboardScore}</p>
                <p className="text-xs text-gray-500">Score</p>
              </div>
            </button>
          ))}
        </div>
      )}
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Best Show of the Month"
      >
        {modalLoading ? (
            <div className="flex justify-center items-center h-48">
                <Spinner />
            </div>
        ) : bestPost ? (
            <PostCard post={bestPost} />
        ) : (
            <p className="text-center text-gray-400 py-8">
                This user didn't have any shows in this period.
            </p>
        )}
    </Modal>
    </div>
  );
};

export default LeaderboardPage;