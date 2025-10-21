import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPost, uploadImage } from '../services/firebaseService.js';
import { Province, PROVINCES } from '../constants.js';
import { useAuth } from '../contexts/AuthContext.js';
import Spinner from '../components/Spinner.js';

const CreatePostPage: React.FC = () => {
    const { userProfile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Pre-fill title if passed from homepage
    const initialTitle = location.state?.title || '';

    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState('');
    const [province, setProvince] = useState<Province>(Province.CULTURAL);
    const [type, setType] = useState<'Text' | 'Image' | 'Video'>('Text');
    const [mediaUrl, setMediaUrl] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Basic validation
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('File size should be less than 5MB.');
                return;
            }
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file.');
                return;
            }
            setImageFile(file);
            setError('');
        }
    };

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
        if (type === 'Text' && !description.trim() && !imageFile) {
            setError('A description or an image is required for a text-based show.');
            return;
        }
        if ((type === 'Image' || type === 'Video') && !mediaUrl.trim()) {
            setError('Please provide a URL for your media.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            let finalMediaUrl = '';
            if (type === 'Text' && imageFile) {
                const uploadResult = await uploadImage(imageFile);
                finalMediaUrl = uploadResult.url;
            } else if (type === 'Image' || type === 'Video') {
                finalMediaUrl = mediaUrl;
            }

            await createPost({
                title,
                description: type === 'Text' ? description : title,
                province,
                type,
                mediaURL: finalMediaUrl,
                authorId: userProfile.uid,
                authorName: userProfile.name,
                authorBatch: userProfile.batch,
                authorRole: userProfile.role,
                approved: false,
            });
            alert("Show submitted for approval! The curators are on it.");
            navigate('/shows');
        } catch (err: any) {
            console.error(err);
            // Safely extract error message and handle specific ImageKit error
            let errorMessage = 'Failed to create show. Please check your connection and try again.';
            if (err && typeof err.message === 'string') {
                if (err.message.includes('Missing token for upload')) {
                    errorMessage = "ImageKit Security Error: Your account requires a security token. To fix this, please go to your ImageKit Dashboard -> Settings -> Upload, and ensure 'Allow unsigned image uploading' is turned ON. Then, save your changes and try again.";
                } else {
                    errorMessage = err.message;
                }
            } else if (err.code === 'permission-denied') {
                errorMessage = "Submission failed: Your account does not have permission to create posts. Please contact an administrator.";
            }

            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };
    
    return (
        <div className="max-w-2xl mx-auto bg-gray-900/70 backdrop-blur-lg border border-gray-700 p-8 rounded-xl shadow-2xl animate-fade-in">
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
                  <>
                    <div>
                      <label htmlFor="post-description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                      <textarea id="post-description" placeholder="Tell us the story..." value={description} onChange={e => setDescription(e.target.value)} rows={5} className="w-full p-3 border rounded-md bg-gray-800 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                     <div>
                        <label htmlFor="post-image-upload" className="block text-sm font-medium text-gray-300 mb-1">Upload an Image (Optional)</label>
                        <input id="post-image-upload" type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-300 hover:file:bg-blue-500/30"/>
                        {imageFile && <p className="text-xs text-gray-500 mt-1">Selected: {imageFile.name}</p>}
                    </div>
                  </>
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