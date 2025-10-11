import React, { useEffect, useState } from 'react';
import { getLeaderboardUsers, getLeaderboardArchives, getArchivedLeaderboard } from '../services/firebaseService.js';
import { UserProfile, LeaderboardArchive, ArchivedUser } from '../types.js';
import Spinner from '../components/Spinner.js';
import RoleBadge from '../components/RoleBadge.js';

type LeaderboardView = 'current' | string; // 'current' or an archive ID like '2024-07'

const LeaderboardPage: React.FC = () => {
  const [users, setUsers] = useState<(UserProfile | ArchivedUser)[]>([]);
  const [archives, setArchives] = useState<{ id: string }[]>([]);
  const [view, setView] = useState<LeaderboardView>('current');
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Current Leaderboard');

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
    let isMounted = true;
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        if (view === 'current') {
            const userList = await getLeaderboardUsers();
            if (isMounted) {
                setTitle('Current Leaderboard');
                setUsers(userList);
            }
        } else {
            const archiveData = await getArchivedLeaderboard(view);
            if (isMounted) {
                setTitle(`Leaderboard: ${view}`);
                setUsers(archiveData ? archiveData.users : []);
            }
        }
      } catch (error) {
          console.error("Failed to fetch leaderboard data:", error);
      } finally {
        if (isMounted) {
            setLoading(false);
        }
      }
    };
    fetchLeaderboard();

    return () => {
        isMounted = false;
    };
  }, [view]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white">{title}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Top performers based on likes and suggestions received.</p>
      </div>

      <div className="mb-6">
        <select 
          value={view} 
          onChange={(e) => setView(e.target.value as LeaderboardView)}
          className="w-full max-w-xs mx-auto block p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="current">Current Leaderboard</option>
          {archives.map(archive => (
            <option key={archive.id} value={archive.id}>
              Archive: {archive.id}
            </option>
          ))}
        </select>
      </div>

      {loading ? <Spinner /> : users.length === 0 ? (
        <p className="text-center text-gray-500 mt-12">No data available for this period.</p>
      ) : (
        <div className="space-y-4">
          {users.map((user, index) => (
            <div 
              key={user.uid} 
              className={`p-4 rounded-lg flex items-center gap-4 transition-all duration-300 shadow-sm border
              ${index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-400' : ''}
              ${index === 1 ? 'bg-gray-200 dark:bg-gray-700/50 border-gray-400' : ''}
              ${index === 2 ? 'bg-orange-100 dark:bg-orange-900/50 border-orange-400' : ''}
              ${index > 2 ? 'bg-white dark:bg-[#161b22] dark:border-gray-800' : ''}
              `}
            >
              <div className="text-2xl font-bold w-10 text-center text-gray-500 dark:text-gray-400">
                {index + 1}
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-3">
                    <p className="font-bold text-lg text-gray-900 dark:text-white">{user.name}</p>
                    <RoleBadge role={user.role} />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Batch {user.batch}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{user.leaderboardScore}</p>
                <p className="text-xs text-gray-500">Score</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
