'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [cookie, setCookie] = useState('');
  const [orgId, setOrgId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Select a random background image on component mount
    const images = ['/bg-1.jpg', '/bg-2.jpg', '/bg-3.jpg', '/bg-4.jpg', '/bg-5.jpg', '/bg-6.jpg'];
    const randomImage = images[Math.floor(Math.random() * images.length)];
    setBackgroundImage(randomImage);

    // Preload the image
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = randomImage;
  }, []);

  const handleStart = () => {
    setError('');

    if (!cookie.trim()) {
      setError('Please provide a Cookie');
      return;
    }

    if (!orgId.trim()) {
      setError('Please provide an Organization ID');
      return;
    }

    setIsLoading(true);

    // Store credentials in sessionStorage
    sessionStorage.setItem('connectplus_cookie', cookie.trim());
    sessionStorage.setItem('connectplus_org_id', orgId.trim());

    // Navigate to chat
    router.push('/chat');
  };

  // Don't render page until image is loaded
  if (!imageLoaded) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        {/* Optional: Add a subtle fade-in effect when loaded */}
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Left Column - Random Background Image */}
      <div
        className="w-1/2 border-r border-gray-200 relative"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Logo in top-left corner */}
        <div className="absolute top-6 left-6">
          <img
            src="/logo-transparent.png"
            alt="Capillary Logo"
            className="h-12"
          />
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Connect+ Copilot
            </h1>
            <p className="text-sm text-gray-600">
              Your AI assistant for Connect+ data flows
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="cookie" className="block text-sm font-medium text-gray-700 mb-1.5">
                Session Cookie
              </label>
              <textarea
                id="cookie"
                rows={4}
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
                placeholder="Paste your session cookie here..."
              />
            </div>

            <div>
              <label htmlFor="orgId" className="block text-sm font-medium text-gray-700 mb-1.5">
                Organization ID
              </label>
              <input
                id="orgId"
                type="text"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 100458"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isLoading ? 'Starting...' : 'Start Chat'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Your credentials are stored securely in your browser session and are not saved permanently.
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
