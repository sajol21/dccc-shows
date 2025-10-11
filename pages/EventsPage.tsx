import React, { useState, useEffect } from 'react';
import { getSessions } from '../services/firebaseService.js';
import { Session } from '../types.js';
import Spinner from '../components/Spinner.js';
import SessionCard from '../components/EventCard.js';

const SessionsPage: React.FC = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
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
                    setSessions(sessionList);
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
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold">Upcoming Sessions</h1>
                <p className="text-gray-400 mt-2">Stay updated with our latest workshops, sessions, and meetups.</p>
            </div>

            {loading ? (
                <Spinner />
            ) : error ? (
                <Alert message={error} />
            ) : sessions.length === 0 ? (
                <p className="text-center text-gray-500 mt-12">No upcoming sessions right now. Stay tuned!</p>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sessions.map(session => (
                        <SessionCard key={session.id} session={session} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SessionsPage;