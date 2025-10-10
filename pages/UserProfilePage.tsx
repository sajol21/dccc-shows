import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile, updateUserProfile, getPostsByAuthor } from '../services/firebaseService';
import { Province, PROVINCES, UserRole } from '../constants';
import { UserProfile, Post } from '../types';
import Spinner from '../components/Spinner';
import PostCard from '../components/PostCard';

const UserProfilePage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const { userProfile: loggedInUserProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [status, setStatus] = useState('');
  
  const isOwner = loggedInUserProfile?.uid === uid;

  useEffect(() => {
    const fetchData = async () => {
      if (!uid) {
        navigate('/');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const [profile, userPosts] = await Promise.all([
          getUserProfile(uid),
          getPostsByAuthor(uid)
        ]);

        if (profile) {
          setProfileData(profile);
          setPosts(userPosts);
        } else {
          setError('User profile not found.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load user data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uid, navigate]);
  
  const handleEditToggle = () => {
    if (!isEditing && profileData) {
        setFormData({
            name: profileData.name,
            phone: profileData.phone,
            batch: profileData.batch,
            province: profileData.province,
        });
    }
    setIsEditing(!isEditing);
    setStatus('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setStatus('Updating...');
    try {
      await updateUserProfile(uid, formData);
      setStatus('Profile updated successfully!');
      setIsEditing(false);
      // Refetch data to show updated info
      const updatedProfile = await getUserProfile(uid);
      setProfileData(updatedProfile);
    } catch(error) {
        console.error(error);
        setStatus('Failed to update profile.');
    }
  };

  if (loading || authLoading) return <Spinner />;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!profileData) return <p>Could not load profile.</p>;

  return (
    <div className="space-y-12">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold">{profileData.name}</h1>
            <p className="text-md text-gray-500 dark:text-gray-400">{profileData.email}</p>
            <span className="mt-2 inline-block bg-blue-100 text-blue-800 text-sm font-semibold mr-2 px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">{profileData.role}</span>
          </div>
          <div className="flex-grow w-full">
              <div className="grid grid-cols-2 gap-4 text-center my-4">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <p className="text-2xl font-bold">{profileData.submissionsCount}</p>
                      <p className="text-sm text-gray-500">Submissions</p>
                  </div>
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <p className="text-2xl font-bold">{profileData.totalLikes}</p>
                      <p className="text-sm text-gray-500">Total Likes</p>
                  </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                      <label className="font-semibold">Full Name:</label>
                      {isEditing ? <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/> : <p className="text-gray-600 dark:text-gray-300">{profileData.name}</p>}
                  </div>
                  <div>
                      <label className="font-semibold">Phone:</label>
                      {isEditing ? <input type="text" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/> : <p className="text-gray-600 dark:text-gray-300">{profileData.phone || 'Not provided'}</p>}
                  </div>
                  <div>
                      <label className="font-semibold">Batch:</label>
                      {isEditing ? <input type="text" name="batch" value={formData.batch || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/> : <p className="text-gray-600 dark:text-gray-300">{profileData.batch || 'Not provided'}</p>}
                  </div>
                   <div>
                      <label className="font-semibold">Province:</label>
                      {isEditing ? (
                          <select name="province" value={formData.province || Province.CULTURAL} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                      ) : <p className="text-gray-600 dark:text-gray-300">{profileData.province}</p>}
                  </div>
                  
                  {isOwner && (
                    <div className="mt-6 flex flex-wrap gap-4">
                        <button type="button" onClick={handleEditToggle} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
                            {isEditing ? 'Cancel' : 'Edit Profile'}
                        </button>
                        {isEditing && (
                            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                                Save Changes
                            </button>
                        )}
                    </div>
                  )}
                   {status && <p className="mt-4 text-center">{status}</p>}
              </form>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-3xl font-bold text-center mb-6">Submissions by {profileData.name}</h2>
        {posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">This user has not submitted any approved posts yet.</p>
        )}
      </section>
    </div>
  );
};

export default UserProfilePage;
