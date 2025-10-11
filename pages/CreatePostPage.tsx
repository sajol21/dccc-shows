import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../services/firebaseService.js';
import { Province, PROVINCES } from '../constants.js';
import { useAuth } from '../hooks/useAuth.js';
import Spinner from '../components/Spinner.js';

const CreatePostPage: React.FC = () => {
    const { userProfile } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [province, setProvince] = useState<Province>(Province.CULTURAL);
    const [type, setType] = useState<'Text' | 'Image' | 'Video'>('Text');
    const [mediaUrl, setMediaUrl] = useState('');
    
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile) {
            setError('You must be logged in to post.');
            return;
        }

        if (!title.trim()) {
            setError('A title is required for all shows.');
            return;
        }
        if (type === 'Text' && !description.trim()) {
            setError('A description is required for a text-based show.');
            return;
        }
        if ((type === 'Image' || type === 'Video') && !mediaUrl.trim()) {
            setError('Please provide a URL for your media.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await createPost({
                title,
                description: type === 'Text' ? description : title,
                province,
                type,
                mediaURL: type === 'Text' ? '' : mediaUrl,
                authorId: userProfile.uid,
                authorName: userProfile.name,
                authorBatch: userProfile.batch,
                authorRole: userProfile.role,
                approved: false,
            });
            alert("Show submitted for approval! The curators are on it.");
            navigate('/shows');
        } catch (err) {
            console.error(err);
            setError('Failed to create show. Please check your connection and try again.');
        } finally {
            setSubmitting(false);
        }
    };
    
    return (
        <div className="max-w-2xl mx-auto bg-gray-900/70 backdrop-blur-lg border border-gray-700 p-8 rounded-xl shadow-2xl">
            <h1 className="text-3xl font-bold text-center mb-6 text-white">Create Your Show</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
                
                <div>
                    <label htmlFor="post-type" className="block text-sm font-medium text-gray-300 mb-1">Show Type</label>
                    <select id="post-type" value={type} onChange={e => setType(e.target.value as any)} className="w-full p-3 border rounded-md bg-gray-800 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500">
                        <option value="Text">Text</option>
                        <option value="Image">Image (URL)</option>
                        <option value="Video">Video (URL)</option>
                    </select>
                </div>
                
                <div>
                    <label htmlFor="post-title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                    <input id="post-title" type="text" placeholder="Title of your masterpiece" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 border rounded-md bg-gray-800 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"/>
                </div>

                {type === 'Text' && (
                  <div>
                    <label htmlFor="post-description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <textarea id="post-description" placeholder="Tell us the story..." value={description} onChange={e => setDescription(e.target.value)} rows={5} className="w-full p-3 border rounded-md bg-gray-800 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"/>
                  </div>
                )}
                
                {(type === 'Image' || type === 'Video') && 
                    <div>
                        <label htmlFor="post-media-url" className="block text-sm font-medium text-gray-300 mb-1">Media URL</label>
                        <input id="post-media-url" type="url" placeholder={type === 'Image' ? "https://example.com/image.png" : "https://youtube.com/watch?v=..."} value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} className="w-full p-3 border rounded-md bg-gray-800 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                }

                 <div>
                    <label htmlFor="post-province" className="block text-sm font-medium text-gray-300 mb-1">Province</label>
                    <select id="post-province" value={province} onChange={e => setProvince(e.target.value as Province)} className="w-full p-3 border rounded-md bg-gray-800 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500">
                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                <button type="submit" disabled={submitting} className="w-full flex justify-center py-3 px-4 text-base font-semibold rounded-lg text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed">
                    {submitting ? <Spinner /> : 'Submit for Review'}
                </button>
            </form>
        </div>
    );
};

export default CreatePostPage;