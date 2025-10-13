import React from 'react';
import { Link } from 'react-router-dom';
import { Session } from '../types.js';

const SessionCard: React.FC<{ session: Session }> = ({ session }) => {
    const isCompleted = session.status === 'completed';

    return (
        <Link to={`/session/${session.id}`} className="h-full">
            <div className={`group relative block bg-black/20 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-400 transition-all duration-300 overflow-hidden transform hover:-translate-y-1 h-full flex flex-col ${isCompleted ? 'grayscale opacity-75 hover:grayscale-0 hover:opacity-100' : ''}`}>
                <div className="relative overflow-hidden aspect-video bg-black">
                    <img 
                        src={session.bannerUrl} 
                        alt={session.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-black/50 p-1.5 px-3 rounded-full backdrop-blur-sm z-10 text-xs text-white">
                        {session.type}
                    </div>
                    {isCompleted && (
                        <div className="absolute top-3 left-3 bg-gray-900/80 p-1.5 px-3 rounded-full backdrop-blur-sm z-10 text-xs text-yellow-300 border border-yellow-400">
                            Completed
                        </div>
                    )}
                </div>
                <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start text-sm text-gray-400 mb-2">
                        <span>
                            {session.eventDate 
                                ? new Date(session.eventDate.toDate()).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                                : 'Date TBD'
                            }
                        </span>
                    </div>
                    <h3 className="text-lg font-bold mb-3 text-white group-hover:text-blue-400 transition-colors">{session.title}</h3>
                    <p className="text-sm text-gray-300 flex-grow line-clamp-3">{session.description}</p>
                </div>
            </div>
        </Link>
    );
};

export default SessionCard;