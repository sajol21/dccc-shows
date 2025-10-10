import React, { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { UserProfile, Post, SiteConfig, Announcement, PromotionRequest } from '../types';
import { 
  getAllUsers, 
  updateUserRole, 
  getAllPostsAdmin, 
  approvePost, 
  deletePost, 
  resetLeaderboard,
  getSiteConfig,
  updateSiteConfig,
  createAnnouncement,
  getAnnouncements,
  getPendingPromotionRequests,
  approvePromotionRequest,
  rejectPromotionRequest
} from '../services/firebaseService';
import { USER_ROLES, UserRole } from '../constants';
import Spinner from '../components/Spinner';

type Tab = 'dashboard' | 'users' | 'posts' | 'promotions' | 'announcements' | 'settings';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [promotionRequests, setPromotionRequests] = useState<PromotionRequest[]>([]);
  const [siteConfig, setSiteConfig] = useState<Partial<SiteConfig>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
        const [userData, postData, configData, announcementData, requestData] = await Promise.all([
            getAllUsers(), 
            getAllPostsAdmin(),
            getSiteConfig(),
            getAnnouncements(),
            getPendingPromotionRequests()
        ]);
        setUsers(userData);
        setPosts(postData);
        setSiteConfig(configData || {});
        setAnnouncements(announcementData);
        setPromotionRequests(requestData);
    } catch(err) {
        console.error("Failed to fetch admin data", err);
        setError("Failed to load dashboard data. Please check permissions and try again.");
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (uid: string, role: UserRole) => {
    if (window.confirm('Are you sure you want to change this user\'s role?')) {
        await updateUserRole(uid, role);
        fetchData(); // Refresh data
    }
  };

  const handleApprovePost = async (postId: string, approved: boolean) => {
    await approvePost(postId, approved);
    fetchData(); // Refresh data
  };

  const handleDeletePost = async (post: Post) => {
    if(window.confirm('Are you sure you want to delete this post permanently? This cannot be undone.')) {
        await deletePost(post);
        fetchData(); // Refresh data
    }
  };

  const handleResetLeaderboard = async () => {
    if(window.confirm('Are you sure you want to archive the current leaderboard and reset all user scores to zero? This is irreversible.')) {
        await resetLeaderboard();
        fetchData(); // Refresh data
        alert('Leaderboard has been archived and reset.');
    }
  };
  
  const TabButton: React.FC<{tab: Tab, label: string, count?: number}> = ({tab, label, count}) => (
      <button onClick={() => setActiveTab(tab)} className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
          {label}
          {count !== undefined && count > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">{count}</span>
          )}
      </button>
  );

  const pendingPostsCount = posts.filter(p => !p.approved).length;

  return (
    <div className="bg-gray-900/70 backdrop-blur-lg border border-gray-700 text-gray-200 p-6 rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold mb-6 text-white">Admin Control Deck</h1>

      <div className="flex flex-wrap gap-2 border-b border-gray-700 mb-6 pb-2">
        <TabButton tab="dashboard" label="Dashboard" />
        <TabButton tab="users" label="Manage Users" />
        <TabButton tab="posts" label="Manage Posts" count={pendingPostsCount} />
        <TabButton tab="promotions" label="Promotions" count={promotionRequests.length} />
        <TabButton tab="announcements" label="Announcements" />
        <TabButton tab="settings" label="Site Settings" />
      </div>

      {loading ? <Spinner /> : error ? <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p> : (
        <div>
          {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                    <h3 className="text-2xl font-bold text-white">{users.length}</h3>
                    <p className="text-gray-400">Total Users</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                    <h3 className="text-2xl font-bold text-white">{posts.length}</h3>
                    <p className="text-gray-400">Total Posts</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                    <h3 className="text-2xl font-bold text-yellow-400">{pendingPostsCount}</h3>
                    <p className="text-gray-400">Pending Approval</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                    <h3 className="text-2xl font-bold text-blue-400">{promotionRequests.length}</h3>
                    <p className="text-gray-400">Promotion Requests</p>
                </div>
              </div>
          )}
          {activeTab === 'users' && <UserManagementTab users={users} onRoleChange={handleRoleChange} />}
          {activeTab === 'posts' && <PostManagementTab posts={posts} onApprove={handleApprovePost} onDelete={handleDeletePost} />}
          {activeTab === 'promotions' && <PromotionRequestTab requests={promotionRequests} onUpdate={fetchData} />}
          {activeTab === 'announcements' && <AnnouncementsTab announcements={announcements} onUpdate={fetchData} />}
          {activeTab === 'settings' && <SettingsTab siteConfig={siteConfig} onResetLeaderboard={handleResetLeaderboard} onUpdate={fetchData}/>}
        </div>
      )}
    </div>
  );
};

// Sub-components for each tab for better organization

const UserManagementTab: React.FC<{ users: UserProfile[], onRoleChange: (uid: string, role: UserRole) => void }> = ({ users, onRoleChange }) => (
    <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800"><tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Batch</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-700">
            {users.map(user => (<tr key={user.uid} className="hover:bg-gray-700/50">
                <td className="px-4 py-2 whitespace-nowrap text-gray-200">{user.name}</td>
                <td className="px-4 py-2 whitespace-nowrap text-gray-200">{user.email}</td>
                <td className="px-4 py-2 whitespace-nowrap text-gray-200">{user.batch}</td>
                <td className="px-4 py-2 whitespace-nowrap"><select value={user.role} onChange={(e) => onRoleChange(user.uid, e.target.value as UserRole)} className="p-1 rounded bg-gray-700 border-gray-600 text-sm text-white">
                    {USER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </select></td></tr>
            ))}</tbody></table></div>
);

const PostManagementTab: React.FC<{ posts: Post[], onApprove: (id: string, approved: boolean) => void, onDelete: (post: Post) => void }> = ({ posts, onApprove, onDelete }) => (
    <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800"><tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Title</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Author</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-700">
            {posts.map(post => (<tr key={post.id} className="hover:bg-gray-700/50">
                <td className="px-4 py-2 whitespace-nowrap"><Link to={`/post/${post.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{post.title}</Link></td>
                <td className="px-4 py-2 whitespace-nowrap text-gray-200">{post.authorName}</td>
                <td className="px-4 py-2 whitespace-nowrap">{post.approved ? <span className="text-green-400 font-semibold">Approved</span> : <span className="text-yellow-400 font-semibold">Pending</span>}</td>
                <td className="px-4 py-2 flex space-x-2">
                    <button onClick={() => onApprove(post.id, !post.approved)} className={`px-2 py-1 text-sm rounded text-white ${post.approved ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}>{post.approved ? 'Hide' : 'Approve'}</button>
                    <button onClick={() => onDelete(post)} className="px-2 py-1 text-sm rounded bg-red-500 hover:bg-red-600 text-white">Delete</button>
                </td></tr>
            ))}</tbody></table></div>
);

const PromotionRequestTab: React.FC<{ requests: PromotionRequest[], onUpdate: () => void }> = ({ requests, onUpdate }) => {
    const handleApprove = async (req: PromotionRequest) => {
        await approvePromotionRequest(req.id, req.userId, req.requestedRole);
        onUpdate();
    }
    const handleReject = async (req: PromotionRequest) => {
        await rejectPromotionRequest(req.id, req.userId);
        onUpdate();
    }
    if (requests.length === 0) {
        return <p>No pending promotion requests.</p>;
    }
    return (
        <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800"><tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Batch</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Current Role</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Requested Role</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-700">
                {requests.map(req => (<tr key={req.id} className="hover:bg-gray-700/50">
                    <td className="px-4 py-2 whitespace-nowrap text-gray-200">{req.userName}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-200">{req.userBatch}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-300">{req.currentRole}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-yellow-400">{req.requestedRole}</td>
                    <td className="px-4 py-2 flex space-x-2">
                        <button onClick={() => handleApprove(req)} className="px-2 py-1 text-sm rounded bg-green-500 hover:bg-green-600 text-white">Approve</button>
                        <button onClick={() => handleReject(req)} className="px-2 py-1 text-sm rounded bg-red-500 hover:bg-red-600 text-white">Reject</button>
                    </td></tr>
                ))}</tbody></table></div>
    );
};

const AnnouncementsTab: React.FC<{ announcements: Announcement[], onUpdate: () => void }> = ({ announcements, onUpdate }) => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!title || !body) return;
        setSubmitting(true);
        try {
            await createAnnouncement(title, body);
            setTitle('');
            setBody('');
            alert('Announcement sent!');
            onUpdate();
        } catch (error) {
            console.error(error);
            alert('Failed to send announcement.');
        } finally {
            setSubmitting(false);
        }
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 className="text-xl font-semibold mb-4">Broadcast a New Message</h3>
                <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-800 border-gray-700">
                    <div>
                        <label htmlFor="ann-title" className="sr-only">Title</label>
                        <input id="ann-title" type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white" />
                    </div>
                    <div>
                        <label htmlFor="ann-body" className="sr-only">Body</label>
                        <textarea id="ann-body" placeholder="Body" value={body} onChange={e => setBody(e.target.value)} rows={4} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white" />
                    </div>
                    <button type="submit" disabled={submitting} className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400">{submitting ? 'Sending...' : 'Send Announcement'}</button>
                </form>
            </div>
            <div>
                 <h3 className="text-xl font-semibold mb-4">Broadcast History</h3>
                 <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {announcements.map(ann => (
                        <div key={ann.id} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                            <p className="font-bold text-white">{ann.title}</p>
                            <p className="text-sm text-gray-300">{ann.body}</p>
                            <p className="text-xs text-gray-400 text-right mt-1">{ann.createdAt ? new Date(ann.createdAt.toDate()).toLocaleString() : ''}</p>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );
};

const SettingsTab: React.FC<{ siteConfig: Partial<SiteConfig>, onResetLeaderboard: () => void, onUpdate: () => void }> = ({ siteConfig: initialConfig, onResetLeaderboard, onUpdate }) => {
    const [config, setConfig] = useState(initialConfig);

    useEffect(() => { setConfig(initialConfig) }, [initialConfig]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.') as ['socials', string];
             setConfig(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value,
                }
            }));
        } else {
            setConfig(prev => ({...prev, [name]: value}));
        }
    };
    
    const handleSave = async () => {
        await updateSiteConfig(config);
        onUpdate();
        alert('Settings updated!');
    };

    return (
        <div className="space-y-6">
            <div className="p-4 border rounded-lg bg-gray-800 border-gray-700">
                 <h3 className="font-bold mb-3 text-lg text-white">Site Configuration</h3>
                 <div className="space-y-3 max-w-xl">
                    <label htmlFor="minRoleToPost" className="block text-sm font-medium">Minimum Role to Post</label>
                    <select id="minRoleToPost" name="minRoleToPost" value={config.minRoleToPost || UserRole.GENERAL_MEMBER} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white">
                        <option value={UserRole.GENERAL_STUDENT}>General Student</option>
                        <option value={UserRole.GENERAL_MEMBER}>General Member</option>
                        <option value={UserRole.ASSOCIATE_MEMBER}>Associate Member</option>
                    </select>
                    
                    <label htmlFor="contactEmail" className="block text-sm font-medium mt-4">Contact & Socials</label>
                    <input id="contactEmail" type="text" name="email" placeholder="Contact Email" value={config.email || ''} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white"/>
                    <input id="contactPhone" type="text" name="phone" placeholder="Contact Phone" value={config.phone || ''} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white"/>
                    <input id="socialFacebook" type="text" name="socials.facebook" placeholder="Facebook URL" value={config.socials?.facebook || ''} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white"/>
                    <input id="socialInstagram" type="text" name="socials.instagram" placeholder="Instagram URL" value={config.socials?.instagram || ''} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white"/>
                    <input id="socialYoutube" type="text" name="socials.youtube" placeholder="YouTube URL" value={config.socials?.youtube || ''} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white"/>
                    
                    <label htmlFor="bannerImageUrl" className="block text-sm font-medium mt-4">Homepage Banner</label>
                    <input id="bannerImageUrl" type="text" name="bannerImageUrl" placeholder="Banner Image URL" value={config.bannerImageUrl || ''} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white"/>
                    <input id="bannerLinkUrl" type="text" name="bannerLinkUrl" placeholder="Banner Link URL" value={config.bannerLinkUrl || ''} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white"/>
                    
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Site Settings</button>
                 </div>
            </div>
            <div className="p-4 border rounded-lg bg-gray-800 border-gray-700">
                <h3 className="font-bold text-white">Reset Monthly Leaderboard</h3>
                <p className="text-sm text-gray-400 mb-3">This will archive the current leaderboard and then reset all user scores to 0. This action is irreversible.</p>
                <button onClick={onResetLeaderboard} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Archive and Reset Now</button>
            </div>
        </div>
    );
};


export default AdminDashboard;