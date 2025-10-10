import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile, updateUserProfile, getPostsByAuthor, createPromotionRequest, getUsersPendingRequest } from '../services/firebaseService';
import { Province, PROVINCES, UserRole } from '../constants';
import { UserProfile, Post, PromotionRequest } from '../types';
import Spinner from '../components/Spinner';
import PostCard from '../components/PostCard';

const NEXT_ROLE_MAP: Partial<Record<UserRole, UserRole>> = {
    [UserRole.GENERAL_STUDENT]: UserRole.GENERAL_MEMBER,
    [UserRole.GENERAL_MEMBER]: UserRole.ASSOCIATE_MEMBER,
};

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
  const [pendingRequest, setPendingRequest] = useState<PromotionRequest | null>(null);
  
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
        const [profile, userPosts, existingRequest] = await Promise.all([
          getUserProfile(uid),
          getPostsByAuthor(uid),
          isOwner ? getUsersPendingRequest(uid) : Promise.resolve(null),
        ]);

        if (profile) {
          setProfileData(profile);
          setPosts(userPosts);
          setPendingRequest(existingRequest);
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
  }, [uid, navigate, isOwner]);
  
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
      const updatedProfile = await getUserProfile(uid);
      setProfileData(updatedProfile);
    } catch(error) {
        console.error(error);
        setStatus('Failed to update profile.');
    }
  };
  
  const handlePromotionRequest = async () => {
    if (!profileData) return;
    const requestedRole = NEXT_ROLE_MAP[profileData.role];
    if (!requestedRole) return;

    if (window.confirm(`Are you sure you want to request a promotion to ${requestedRole}?`)) {
        try {
            await createPromotionRequest(profileData, requestedRole);
            setPendingRequest({} as PromotionRequest); // Mock object to disable button
            alert('Your promotion request has been submitted for review.');
        } catch (err) {
            console.error(err);
            alert('Failed to submit promotion request.');
        }
    }
  };

  if (loading || authLoading) return <Spinner />;
  if (error) return <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>;
  if (!profileData) return <p>Could not load profile.</p>;
  
  const canRequestPromotion = isOwner && NEXT_ROLE_MAP[profileData.role] && !pendingRequest;

  return (
    <div className="space-y-12">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-white">{profileData.name}</h1>
            <p className="text-md text-gray-400">{profileData.email}</p>
            <span className="mt-2 inline-block bg-blue-900/50 text-blue-300 text-sm font-semibold mr-2 px-2.5 py-0.5 rounded">{profileData.role}</span>
          </div>
          <div className="flex-grow w-full">
              <div className="grid grid-cols-2 gap-4 text-center my-4">
                  <div className="p-4 bg-gray-700 rounded-lg">
                      <p className="text-2xl font-bold text-white">{profileData.submissionsCount}</p>
                      <p className="text-sm text-gray-400">Submissions</p>
                  </div>
                  <div className="p-4 bg-gray-700 rounded-lg">
                      <p className="text-2xl font-bold text-white">{profileData.totalLikes}</p>
                      <p className="text-sm text-gray-400">Total Likes</p>
                  </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                      <label htmlFor="profile-name" className="font-semibold text-gray-300">Full Name:</label>
                      {isEditing ? <input id="profile-name" type="text" name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white"/> : <p className="text-gray-300">{profileData.name}</p>}
                  </div>
                  <div>
                      <label htmlFor="profile-phone" className="font-semibold text-gray-300">Phone:</label>
                      {isEditing ? <input id="profile-phone" type="text" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white"/> : <p className="text-gray-300">{profileData.phone || 'Not provided'}</p>}
                  </div>
                  <div>
                      <label htmlFor="profile-batch" className="font-semibold text-gray-300">Batch:</label>
                      {isEditing ? <input id="profile-batch" type="text" name="batch" value={formData.batch || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white"/> : <p className="text-gray-300">{profileData.batch || 'Not provided'}</p>}
                  </div>
                   <div>
                      <label htmlFor="profile-province" className="font-semibold text-gray-300">Province:</label>
                      {isEditing ? (
                          <select id="profile-province" name="province" value={formData.province || Province.CULTURAL} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white">
                              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                      ) : <p className="text-gray-300">{profileData.province}</p>}
                  </div>
                  
                  {isOwner && (
                    <div className="mt-6 flex flex-wrap gap-4 items-center">
                        <button type="button" onClick={handleEditToggle} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 text-white">
                            {isEditing ? 'Cancel' : 'Edit Profile'}
                        </button>
                        {isEditing && (
                            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                                Save Changes
                            </button>
                        )}
                        {canRequestPromotion && (
                            <button type="button" onClick={handlePromotionRequest} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                                Request Promotion to {NEXT_ROLE_MAP[profileData.role]}
                            </button>
                        )}
                         {isOwner && pendingRequest && (
                            <p className="text-sm text-yellow-400">Your promotion request is pending review.</p>
                        )}
                    </div>
                  )}
                   {status && <p className={`mt-4 text-center text-sm ${status.startsWith('Failed') ? 'text-red-400' : 'text-green-400'}`}>{status}</p>}
              </form>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-100">Creations by {profileData.name}</h2>
        {posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400">This artist's canvas is currently empty. A masterpiece is surely on the way!</p>
        )}
      </section>
    </div>
  );
};

export default UserProfilePage;