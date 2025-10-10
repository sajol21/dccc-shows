import React, { useState, useEffect, FormEvent } from 'react';
import { UserProfile, Post, ContactMessage, SiteConfig, Announcement } from '../types';
import { 
  getAllUsers, 
  updateUserRole, 
  getAllPostsAdmin, 
  approvePost, 
  deletePost, 
  resetLeaderboard,
  getContactMessages,
  deleteContactMessage,
  getSiteConfig,
  updateSiteConfig,
  createAnnouncement,
  getAnnouncements
} from '../services/firebaseService';
import { USER_ROLES, UserRole } from '../constants';
import Spinner from '../components/Spinner';

type Tab = 'dashboard' | 'users' | 'posts' | 'messages' | 'announcements' | 'settings';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [siteConfig, setSiteConfig] = useState<Partial<SiteConfig>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
        const [userData, postData, messageData, configData, announcementData] = await Promise.all([
            getAllUsers(), 
            getAllPostsAdmin(),
            getContactMessages(),
            getSiteConfig(),
            getAnnouncements()
        ]);
        setUsers(userData);
        setPosts(postData);
        setMessages(messageData);
        setSiteConfig(configData || { socials: {} });
        setAnnouncements(announcementData);
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

  const handleDeleteMessage = async (id: string) => {
    if(window.confirm('Are you sure you want to delete this message?')) {
        await deleteContactMessage(id);
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
  
  const TabButton: React.FC<{tab: Tab, label: string}> = ({tab, label}) => (
      <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === tab ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
          {label}
      </button>
  );

  const pendingPostsCount = posts.filter(p => !p.approved).length;

  return (
    <div className="bg-white/10 dark:bg-black/20 backdrop-blur-lg border border-white/20 p-6 rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="flex flex-wrap gap-2 border-b border-white/20 dark:border-gray-700 mb-6 pb-2">
        <TabButton tab="dashboard" label="Dashboard" />
        <TabButton tab="users" label="Manage Users" />
        <TabButton tab="posts" label="Manage Posts" />
        <TabButton tab="messages" label="Messages" />
        <TabButton tab="announcements" label="Announcements" />
        <TabButton tab="settings" label="Site Settings" />
      </div>

      {loading ? <Spinner /> : error ? <p className="text-red-500 bg-red-100 p-4 rounded-md">{error}</p> : (
        <div>
          {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 dark:bg-black/20 p-4 rounded-lg text-center border border-white/10">
                    <h3 className="text-2xl font-bold">{users.length}</h3>
                    <p className="text-gray-500 dark:text-gray-400">Total Users</p>
                </div>
                <div className="bg-white/5 dark:bg-black/20 p-4 rounded-lg text-center border border-white/10">
                    <h3 className="text-2xl font-bold">{posts.length}</h3>
                    <p className="text-gray-500 dark:text-gray-400">Total Posts</p>
                </div>
                <div className="bg-white/5 dark:bg-black/20 p-4 rounded-lg text-center border border-white/10">
                    <h3 className="text-2xl font-bold text-yellow-500">{pendingPostsCount}</h3>
                    <p className="text-gray-500 dark:text-gray-400">Pending Approval</p>
                </div>
                <div className="bg-white/5 dark:bg-black/20 p-4 rounded-lg text-center border border-white/10">
                    <h3 className="text-2xl font-bold">{messages.length}</h3>
                    <p className="text-gray-500 dark:text-gray-400">Unread Messages</p>
                </div>
              </div>
          )}
          {activeTab === 'users' && <UserManagementTab users={users} onRoleChange={handleRoleChange} />}
          {activeTab === 'posts' && <PostManagementTab posts={posts} onApprove={handleApprovePost} onDelete={handleDeletePost} />}
          {activeTab === 'messages' && <MessageManagementTab messages={messages} onDelete={handleDeleteMessage} />}
          {activeTab === 'announcements' && <AnnouncementsTab announcements={announcements} onUpdate={fetchData} />}
          {activeTab === 'settings' && <SettingsTab siteConfig={siteConfig} onResetLeaderboard={handleResetLeaderboard} onUpdate={fetchData}/>}
        </div>
      )}
    </div>
  );
};

// Sub-components for each tab for better organization

const UserManagementTab: React.FC<{ users: UserProfile[], onRoleChange: (uid: string, role: UserRole) => void }> = ({ users, onRoleChange }) => (
    <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50/10 dark:bg-gray-700/20"><tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Batch</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map(user => (<tr key={user.uid} className="hover:bg-white/5 dark:hover:bg-gray-700/20">
                <td className="px-4 py-2 whitespace-nowrap">{user.name}</td>
                <td className="px-4 py-2 whitespace-nowrap">{user.email}</td>
                <td className="px-4 py-2 whitespace-nowrap">{user.batch}</td>
                <td className="px-4 py-2 whitespace-nowrap"><select value={user.role} onChange={(e) => onRoleChange(user.uid, e.target.value as UserRole)} className="p-1 rounded bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-sm">
                    {USER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </select></td></tr>
            ))}</tbody></table></div>
);

const PostManagementTab: React.FC<{ posts: Post[], onApprove: (id: string, approved: boolean) => void, onDelete: (post: Post) => void }> = ({ posts, onApprove, onDelete }) => (
    <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50/10 dark:bg-gray-700/20"><tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Title</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Author</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {posts.map(post => (<tr key={post.id} className="hover:bg-white/5 dark:hover:bg-gray-700/20">
                <td className="px-4 py-2 whitespace-nowrap"><a href={`/#/post/${post.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{post.title}</a></td>
                <td className="px-4 py-2 whitespace-nowrap">{post.authorName}</td>
                <td className="px-4 py-2 whitespace-nowrap">{post.approved ? <span className="text-green-500 font-semibold">Approved</span> : <span className="text-yellow-500 font-semibold">Pending</span>}</td>
                <td className="px-4 py-2 flex space-x-2">
                    <button onClick={() => onApprove(post.id, !post.approved)} className={`px-2 py-1 text-sm rounded text-white ${post.approved ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}>{post.approved ? 'Hide' : 'Approve'}</button>
                    <button onClick={() => onDelete(post)} className="px-2 py-1 text-sm rounded bg-red-500 hover:bg-red-600 text-white">Delete</button>
                </td></tr>
            ))}</tbody></table></div>
);

const MessageManagementTab: React.FC<{ messages: ContactMessage[], onDelete: (id: string) => void }> = ({ messages, onDelete }) => (
    <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50/10 dark:bg-gray-700/20"><tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">From</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Message</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Received</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {messages.map(msg => (<tr key={msg.id} className="hover:bg-white/5 dark:hover:bg-gray-700/20">
                <td className="px-4 py-2 whitespace-nowrap"><p className="font-medium">{msg.name}</p><p className="text-xs text-gray-500">{msg.email}</p></td>
                <td className="px-4 py-2 text-sm max-w-md">{msg.message}</td>
                <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">{new Date(msg.timestamp?.toDate()).toLocaleString()}</td>
                <td className="px-4 py-2 whitespace-nowrap"><button onClick={() => onDelete(msg.id)} className="px-2 py-1 text-sm rounded bg-red-500 hover:bg-red-600 text-white">Delete</button></td>
            </tr>))}</tbody></table></div>
);

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
                <h3 className="text-xl font-semibold mb-4">Create New Announcement</h3>
                <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg border-white/20">
                    <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50/10 dark:bg-gray-700/20 border-white/20 dark:border-gray-600" />
                    <textarea placeholder="Body" value={body} onChange={e => setBody(e.target.value)} rows={4} className="w-full p-2 border rounded-md bg-gray-50/10 dark:bg-gray-700/20 border-white/20 dark:border-gray-600" />
                    <button type="submit" disabled={submitting} className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400">{submitting ? 'Sending...' : 'Send Announcement'}</button>
                </form>
            </div>
            <div>
                 <h3 className="text-xl font-semibold mb-4">Recent Announcements</h3>
                 <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {announcements.map(ann => (
                        <div key={ann.id} className="p-3 bg-white/5 dark:bg-black/20 rounded-lg border border-white/10">
                            <p className="font-bold">{ann.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{ann.body}</p>
                            <p className="text-xs text-gray-500 text-right mt-1">{new Date(ann.createdAt?.toDate()).toLocaleString()}</p>
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setConfig(prev => ({...prev, [parent]: { ...(prev as any)[parent], [child]: value }}));
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
            <div className="p-4 border rounded-lg border-white/20 max-w-xl">
                 <h3 className="font-bold mb-3 text-lg">Site Configuration</h3>
                 <div className="space-y-3">
                    <input type="text" name="email" placeholder="Contact Email" value={config.email || ''} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50/10 dark:bg-gray-700/20 border-white/20 dark:border-gray-600"/>
                    <input type="text" name="phone" placeholder="Contact Phone" value={config.phone || ''} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50/10 dark:bg-gray-700/20 border-white/20 dark:border-gray-600"/>
                    <input type="text" name="socials.facebook" placeholder="Facebook URL" value={config.socials?.facebook || ''} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50/10 dark:bg-gray-700/20 border-white/20 dark:border-gray-600"/>
                    <input type="text" name="socials.instagram" placeholder="Instagram URL" value={config.socials?.instagram || ''} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50/10 dark:bg-gray-700/20 border-white/20 dark:border-gray-600"/>
                    <input type="text" name="socials.youtube" placeholder="YouTube URL" value={config.socials?.youtube || ''} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50/10 dark:bg-gray-700/20 border-white/20 dark:border-gray-600"/>
                    <input type="text" name="bannerImageUrl" placeholder="Homepage Banner Image URL" value={config.bannerImageUrl || ''} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50/10 dark:bg-gray-700/20 border-white/20 dark:border-gray-600"/>
                    <input type="text" name="bannerLinkUrl" placeholder="Homepage Banner Link URL" value={config.bannerLinkUrl || ''} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50/10 dark:bg-gray-700/20 border-white/20 dark:border-gray-600"/>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Site Settings</button>
                 </div>
            </div>
            <div className="p-4 border rounded-lg border-white/20 max-w-xl">
                <h3 className="font-bold">Reset Monthly Leaderboard</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">This will archive the current leaderboard and then reset all user scores to 0. This action is irreversible.</p>
                <button onClick={onResetLeaderboard} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Archive and Reset Now</button>
            </div>
        </div>
    );
};


export default AdminDashboard;