import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSiteConfig } from '../services/firebaseService';
import { SiteConfig } from '../types';

const Footer: React.FC = () => {
    const [config, setConfig] = useState<SiteConfig | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            const siteConfig = await getSiteConfig();
            setConfig(siteConfig);
        }
        fetchConfig();
    }, []);

  return (
    <footer className="bg-black/20 backdrop-blur-lg border-t border-white/10 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
                <Link to="/" className="flex-shrink-0 mb-2 inline-block">
                    <img src="https://res.cloudinary.com/dabfeqgsj/image/upload/v1759778648/cyizstrjgcq0w9fr8cxp.png" alt="DCCC Logo" className="h-8 w-auto mx-auto md:mx-0" />
                </Link>
                <p className="text-sm text-gray-400">Dhaka College Cultural Club</p>
            </div>
            <div>
                <h3 className="font-bold text-gray-200 mb-2">Contact Us</h3>
                <div className="text-sm text-gray-400 space-y-1">
                    <p>Email: <a href={`mailto:${config?.email}`} className="hover:underline">{config?.email || '...'}</a></p>
                    <p>Phone: <a href={`tel:${config?.phone}`} className="hover:underline">{config?.phone || '...'}</a></p>
                </div>
            </div>
            <div>
                <h3 className="font-bold text-gray-200 mb-2">Follow Us</h3>
                <div className="flex justify-center md:justify-start space-x-4">
                    <a href={config?.socials?.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors"><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /></svg></a>
                    <a href={config?.socials?.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors"><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.25-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.85s.012-3.584.07-4.85c.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.947s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44 1.441-.645 1.441-1.44-.645-1.44-1.441-1.44z" /></svg></a>
                    <a href={config?.socials?.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors"><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg></a>
                </div>
            </div>
        </div>
        <div className="mt-8 pt-4 border-t border-gray-700 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} DCCC. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;