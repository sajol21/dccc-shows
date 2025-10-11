import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSession } from '../services/firebaseService.js';
import { Session } from '../types.js';
import Spinner from '../components/Spinner.js';

const InfoBlock: React.FC<{ icon: React.ReactNode, title: string, value: string }> = ({ icon, title, value }) => (
    <div className="flex items-center gap-4 p-2">
        <div className="flex-shrink-0 text-blue-400">
            {icon}
        </div>
        <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
            <p className="text-lg font-bold text-white">{value}</p>
        </div>
    </div>
);

const SessionDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        let isMounted = true;
        const fetchSession = async () => {
            setLoading(true);
            setError('');
            try {
                const sessionData = await getSession(id);
                if (isMounted) {
                    if (sessionData) {
                        setSession(sessionData);
                    } else {
                        setError('Session not found.');
                    }
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Failed to fetch session:', err);
                    setError('An error occurred while loading the session details.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchSession();
        return () => { isMounted = false; };
    }, [id]);

    if (loading) return <Spinner />;
    if (error) return <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>;
    if (!session) return null;
    
    const eventDate = session.eventDate ? new Date(session.eventDate.toDate()) : null;

    return (
        <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl border border-gray-700 shadow-xl overflow-hidden max-w-4xl mx-auto">
            <div className="bg-black">
                <img src={session.bannerUrl} alt={session.title} className="w-full aspect-video object-cover" />
            </div>
            <div className="p-6 md:p-10 text-gray-200">
                <header className="mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-white">{session.title}</h1>
                        <span className="flex-shrink-0 bg-blue-900/50 text-blue-300 text-sm font-semibold mr-2 px-3 py-1 rounded-full">{session.type}</span>
                    </div>
                </header>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8 p-4 bg-black/20 rounded-lg border border-gray-700">
                    <InfoBlock
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                        title="Date"
                        value={eventDate ? eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD'}
                    />
                    <InfoBlock
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        title="Time"
                        value={eventDate ? eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }) : 'TBD'}
                    />
                    <InfoBlock
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                        title="Venue"
                        value={session.place || 'Online'}
                    />
                </div>

                <article className="prose prose-invert max-w-none text-lg text-gray-300 mb-8 whitespace-pre-wrap">
                    <p>{session.description}</p>
                </article>

                {session.linkUrl && (
                    <div className="text-center pt-8 border-t border-gray-700">
                        <a 
                            href={session.linkUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
                        >
                            Register or Learn More
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionDetailPage;