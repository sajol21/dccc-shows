import React, { useState, useEffect } from 'react';
import { getSessions } from '../services/firebaseService.js';
import { Session } from '../types.js';
import Spinner from '../components/Spinner.js';
import SessionCard from '../components/SessionCard.js';

const SessionsPage: React.FC = () => {
    const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
    const [pastSessions, setPastSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchSessions = async () => {
            setLoading(true);
            setError(null);
            try {
                const sessionList = await getSessions();
                if (isMounted) {
                    const upcoming = sessionList
                        .filter(s => s.status !== 'completed')
                        .sort((a, b) => a.eventDate.toDate().getTime() - b.eventDate.toDate().getTime());
                    const past = sessionList
                        .filter(s => s.status === 'completed')
                        .sort((a, b) => b.eventDate.toDate().getTime() - a.eventDate.toDate().getTime());
                    
                    setUpcomingSessions(upcoming);
                    setPastSessions(past);
                }
            } catch (err) {
                if (isMounted) {
                    console.error("Failed to fetch sessions:", err);
                    setError("Could not load sessions. An administrator should check if Firestore security rules allow public read access to the 'sessions' collection.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        fetchSessions();

        return () => { isMounted = false; };
    }, []);

    const Alert: React.FC<{ message: string }> = ({ message }) => (
        <div className="text-center text-red-400 bg-red-900/50 p-3 my-4 rounded-md" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{message}</span>
        </div>
      );

    return (
        <div>
            {loading ? (
                <Spinner />
            ) : error ? (
                <Alert message={error} />
            ) : (
                <>
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold">Upcoming Sessions</h1>
                        <p className="text-gray-400 mt-2">Stay updated with our latest workshops, sessions, and meetups.</p>
                    </div>
                    {upcomingSessions.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {upcomingSessions.map(session => (
                                <SessionCard key={session.id} session={session} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 mt-12">No upcoming sessions right now. Stay tuned!</p>
                    )}

                    {pastSessions.length > 0 && (
                        <>
                            <div className="text-center mt-16 mb-8">
                                <h2 className="text-3xl font-bold">Past Sessions</h2>
                                <p className="text-gray-400 mt-2">An archive of our completed events.</p>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {pastSessions.map(session => (
                                    <SessionCard key={session.id} session={session} />
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default SessionsPage;