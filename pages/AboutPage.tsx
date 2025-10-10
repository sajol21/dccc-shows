import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getCommitteeMembers } from '../services/firebaseService';
import Spinner from '../components/Spinner';

const AboutPage: React.FC = () => {
  const [committee, setCommittee] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommittee = async () => {
      setLoading(true);
      try {
        const members = await getCommitteeMembers();
        setCommittee(members);
      } catch (error) {
        console.error("Failed to fetch committee members:", error);
      }
      setLoading(false);
    };
    fetchCommittee();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-6">
      <h1 className="text-4xl font-bold text-center">About DCCC</h1>
      <p className="text-lg text-gray-700 dark:text-gray-300">
        Dhaka College Cultural Club (DCCC) is a vibrant community of students passionate about arts, culture, and technology. Our mission is to provide a platform for students to showcase their talents, collaborate on creative projects, and foster a rich cultural environment within the college.
      </p>
      
      <section>
        <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
          <li>To encourage and promote cultural and technical activities among students.</li>
          <li>To organize workshops, competitions, and events to nurture talent.</li>
          <li>To build a supportive community where creativity and innovation can flourish.</li>
          <li>To represent Dhaka College in various cultural and technical forums.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Executive Committee</h2>
        {loading ? <Spinner /> : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {committee.map(member => (
                    <div key={member.uid} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                        <h3 className="font-bold text-lg">{member.name}</h3>
                        <p className="text-sm text-blue-500 dark:text-blue-400 font-semibold">{member.role}</p>
                    </div>
                ))}
            </div>
        )}
      </section>
    </div>
  );
};

export default AboutPage;