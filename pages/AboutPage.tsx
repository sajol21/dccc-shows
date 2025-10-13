import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types.js';
import { getCommitteeMembers } from '../services/firebaseService.js';
import SEO from '../components/SEO.js';

const AboutPage: React.FC = () => {
  const [committee, setCommittee] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCommittee = async () => {
      setLoading(true);
      try {
        const members = await getCommitteeMembers();
        if (isMounted) {
            setCommittee(members);
        }
      } catch (error) {
        console.error("Failed to fetch committee members:", error);
      } finally {
        if (isMounted) {
            setLoading(false);
        }
      }
    };
    fetchCommittee();

    return () => {
        isMounted = false;
    };
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-8 space-y-6 animate-fade-in">
      <SEO
        title="About DCCC | Dhaka College Cultural Club"
        description="Learn about the mission of the Dhaka College Cultural Club and meet the executive committee members who lead our vibrant community."
        keywords="about DCCC, mission, executive committee, Dhaka College"
      />
      <h1 className="text-4xl font-bold text-center text-white">About DCCC</h1>
      <p className="text-lg text-gray-300">
        Dhaka College Cultural Club (DCCC) is a vibrant community of students passionate about arts, culture, and technology. Our mission is to provide a platform for students to showcase their talents, collaborate on creative projects, and foster a rich cultural environment within the college.
      </p>
      
      <section>
        <h2 className="text-2xl font-semibold mb-3 text-white">Our Mission</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-400">
          <li>To encourage and promote cultural and technical activities among students.</li>
          <li>To organize workshops, competitions, and events to nurture talent.</li>
          <li>To build a supportive community where creativity and innovation can flourish.</li>
          <li>To represent Dhaka College in various cultural and technical forums.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3 text-white">Executive Committee</h2>
        {loading ? (
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 animate-pulse">
                      <div className="h-5 bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                  </div>
              ))}
          </div>
        ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {committee.map(member => (
                    <div key={member.uid} className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                        <h3 className="font-bold text-lg text-white">{member.name}</h3>
                        <p className="text-sm text-blue-400 font-semibold">{member.role}</p>
                    </div>
                ))}
            </div>
        )}
      </section>
    </div>
  );
};

export default AboutPage;