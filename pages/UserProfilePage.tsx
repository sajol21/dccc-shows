import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { getUserProfile, updateUserProfile, getPostsByAuthor, createPromotionRequest, getUsersPendingRequest, recalculateUserStats } from '../services/firebaseService.js';
import { Province, PROVINCES, UserRole } from '../constants.js';
import { UserProfile, Post, PromotionRequest } from '../types.js';
import PostCard from '../components/PostCard.js';
import SkeletonPostCard from '../components/SkeletonPostCard.js';
import { ALL_BADGES, Badge } from '../badges.js';
import SEO from '../components/SEO.js';

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
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  
  const isOwner = loggedInUserProfile?.uid === uid;

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!uid) {
        navigate('/');
        return;
      }
      setLoading(true);
      setError('');
      try {
        // Securely recalculate stats for the owner on page load to keep them fresh.
        if (isOwner) {
            await recalculateUserStats(uid).catch(err => {
                console.warn("Could not recalculate user stats:", err);
            });
        }
        
        const [profileResult, postsResult, requestResult] = await Promise.allSettled([
          getUserProfile(uid),
          getPostsByAuthor(uid),
          isOwner ? getUsersPendingRequest(uid) : Promise.resolve(null),
        ]);

        if (isMounted) {
            if (profileResult.status === 'fulfilled' && profileResult.value) {
              const profile = profileResult.value;
              setProfileData(profile);
            } else {
              setError('User profile not found.');
              console.error(profileResult.status === 'rejected' ? profileResult.reason : 'No profile data');
            }
            if (postsResult.status === 'fulfilled') {
              setPosts(postsResult.value);
            } else {
              console.error('Failed to fetch user posts:', postsResult.reason);
            }
            // Silently handle permission errors for pending requests.
            if (requestResult.status === 'fulfilled') {
              setPendingRequest(requestResult.value);
            } else {
              console.warn('Could not fetch pending promotion requests, likely due to Firestore permissions. The promotion button might be incorrectly displayed if a request is already pending.');
              setPendingRequest(null);
            }
        }
      } catch (err) {
        if (isMounted) {
            console.error(err);
            setError('Failed to load user data.');
        }
      } finally {
        if (isMounted) {
            setLoading(false);
        }
      }
    };

    if (!authLoading) {
      fetchData();
    }

    return () => {
        isMounted = false;
    };
  }, [uid, navigate, isOwner, authLoading]);
  
  const handleEditToggle = () => {
    if (!isEditing && profileData) {
        setFormData({
            name: profileData.name,
            phone: profileData.phone,
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
      setProfileData(prev => prev ? { ...prev, ...formData } as UserProfile : null);
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

  if (loading || authLoading) {
    const skeletonPatternStyle = {
        backgroundColor: 'rgba(55, 65, 81, 1)', // gray-700
        backgroundImage: `url('https://res.cloudinary.com/dabfeqgsj/image/upload/c_scale,o_10,w_40/v1759850540/re04d3ncwpwk75wllsfh.png')`,
        backgroundRepeat: 'repeat',
    };
    return (
      <div className="space-y-12">
        <div className="max-w-5xl mx-auto bg-gray-800 rounded-lg shadow-xl p-4 md:p-8 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {/* Left Column Skeleton (Top on Mobile) */}
                <div className="md:col-span-2 space-y-8">
                    <div>
                        <div className="h-8 rounded w-48 mb-2" style={skeletonPatternStyle}></div>
                        <div className="h-5 rounded w-64 mb-3" style={skeletonPatternStyle}></div>
                        <div className="h-5 rounded w-32 mb-6" style={skeletonPatternStyle}></div>
                    </div>
                    <div>
                        <div className="h-6 rounded w-40 mb-4" style={skeletonPatternStyle}></div>
                        <div className="flex flex-wrap gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="w-12 h-12 rounded-full" style={skeletonPatternStyle}></div>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Right Column Skeleton (Bottom on Mobile) */}
                <div className="md:col-span-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="p-4 rounded-lg h-20" style={skeletonPatternStyle}></div>
                        <div className="p-4 rounded-lg h-20" style={skeletonPatternStyle}></div>
                        <div className="p-4 rounded-lg h-20" style={skeletonPatternStyle}></div>
                    </div>
                    <div className="space-y-4 mt-6">
                        <div>
                            <div className="h-4 rounded w-20 mb-2" style={skeletonPatternStyle}></div>
                            <div className="h-5 rounded w-full" style={skeletonPatternStyle}></div>
                        </div>
                        <div>
                            <div className="h-4 rounded w-20 mb-2" style={skeletonPatternStyle}></div>
                            <div className="h-5 rounded w-full" style={skeletonPatternStyle}></div>
                        </div>
                        <div>
                            <div className="h-4 rounded w-20 mb-2" style={skeletonPatternStyle}></div>
                            <div className="h-5 rounded w-full" style={skeletonPatternStyle}></div>
                        </div>
                        <div>
                            <div className="h-4 rounded w-20 mb-2" style={skeletonPatternStyle}></div>
                            <div className="h-5 rounded w-full" style={skeletonPatternStyle}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <section>
          <div className="h-8 rounded w-1/3 mx-auto mb-8 animate-pulse" style={skeletonPatternStyle}></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => <SkeletonPostCard key={index} />)}
          </div>
        </section>
      </div>
    );
  }

  if (error) return <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>;
  if (!profileData) return <p>Could not load profile.</p>;
  
  const canRequestPromotion = isOwner && NEXT_ROLE_MAP[profileData.role] && !pendingRequest;
  
  const earnedBadgeIds = new Set(ALL_BADGES.filter(b => b.condition(profileData)).map(b => b.id));
  
  const profileStructuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": profileData.name,
    "url": window.location.href,
    "description": `Profile of ${profileData.name}, a ${profileData.role} and member of the Dhaka College Cultural Club.`,
    "mainEntityOfPage": {
       "@type": "WebPage",
       "@id": window.location.href
    },
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/LikeAction",
        "userInteractionCount": profileData.totalLikes
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/WriteAction",
        "userInteractionCount": profileData.submissionsCount
      }
    ],
    "worksFor": {
      "@type": "Organization",
      "name": "Dhaka College Cultural Club"
    }
  };


  return (
    <div className="space-y-12 animate-fade-in">
       <SEO
        title={`${profileData.name} (${profileData.role}) | DCCC Profile`}
        description={`View the profile and creative works of ${profileData.name}, a ${profileData.role} from Batch ${profileData.batch} at the Dhaka College Cultural Club.`}
        keywords={`${profileData.name}, DCCC profile, Dhaka College, student portfolio`}
        structuredData={profileStructuredData}
      />
      <div className="max-w-5xl mx-auto bg-gray-800 rounded-lg shadow-xl p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Left Column */}
            <div className="md:col-span-2 space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-white">{profileData.name}</h1>
                <p className="text-md text-gray-400 break-words">{profileData.email}</p>
                <span className="mt-2 inline-block bg-blue-900/50 text-blue-300 text-sm font-semibold mr-2 px-2.5 py-0.5 rounded">{profileData.role}</span>
              </div>
              
              <div>
                <h2 className="text-xl font-bold text-gray-100 mb-4">Achievements</h2>
                <div className="flex flex-wrap gap-4">
                  {ALL_BADGES.map(badge => {
                      const isUnlocked = earnedBadgeIds.has(badge.id);
                      return (
                          <button
                              key={badge.id}
                              onClick={() => setSelectedBadge(badge)}
                              className={`p-3 rounded-full transition-all duration-300 transform hover:scale-110
                                  ${isUnlocked ? 'bg-yellow-400/20 text-yellow-300' : 'bg-gray-700 text-gray-500 grayscale opacity-60'}
                                  ${selectedBadge?.id === badge.id ? 'ring-2 ring-blue-400' : ''}
                              `}
                              aria-label={`View details for ${badge.name} badge`}
                          >
                              {badge.icon}
                          </button>
                      );
                  })}
                </div>

                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${selectedBadge ? 'max-h-40 mt-4' : 'max-h-0'}`}>
                    {selectedBadge && (
                        <div className="bg-gray-700/50 p-4 rounded-lg animate-fade-in">
                            <h4 className="font-bold text-white">{selectedBadge.name}</h4>
                            <p className="text-sm text-gray-400">{selectedBadge.description}</p>
                        </div>
                    )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="md:col-span-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mb-6">
                    <div className="p-4 bg-gray-700 rounded-lg">
                        <p className="text-2xl font-bold text-white">{profileData.submissionsCount}</p>
                        <p className="text-sm text-gray-400">Submissions</p>
                    </div>
                    <div className="p-4 bg-gray-700 rounded-lg">
                        <p className="text-2xl font-bold text-white">{profileData.totalLikes}</p>
                        <p className="text-sm text-gray-400">Appreciates</p>
                    </div>
                     <div className="p-4 bg-gray-700 rounded-lg">
                        <p className="text-2xl font-bold text-white">{profileData.totalSuggestions}</p>
                        <p className="text-sm text-gray-400">Suggestions</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="profile-name" className="font-semibold text-gray-300">Full Name:</label>
                        {isEditing ? <input id="profile-name" type="text" name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white"/> : <p className="text-gray-300">{profileData.name}</p>}
                    </div>
                    {isOwner && (
                        <div>
                            <label htmlFor="profile-phone" className="font-semibold text-gray-300">Phone:</label>
                             {isEditing ? (
                                <input id="profile-phone" type="text" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white"/>
                             ) : (
                               <p className="text-gray-300">{profileData.phone || 'Not provided'}</p>
                             )}
                        </div>
                    )}
                    <div>
                        <label className="font-semibold text-gray-300">Batch:</label>
                        <p className="text-gray-300">{profileData.batch || 'Not provided'}</p>
                    </div>
                    <div>
                        <label className="font-semibold text-gray-300">Province:</label>
                        <p className="text-gray-300">{profileData.province}</p>
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
                     {status && <p className={`mt-4 text-center text-sm ${status.includes('Failed') || status.includes('error') ? 'text-red-400' : 'text-green-400'}`}>{status}</p>}
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