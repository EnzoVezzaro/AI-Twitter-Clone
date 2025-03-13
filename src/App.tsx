import React, { useState, useEffect } from 'react';
import { Twitter, TrendingUp, Search, UserCircle } from 'lucide-react';
import { TweetInput } from './components/TweetInput';
import { Tweet } from './components/Tweet';
import { LoginModal } from './components/LoginModal';
import { getTweets } from './lib/db';
import type { Tweet as TweetType, User } from './types';

function App() {
  const [tweets, setTweets] = useState<TweetType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const loadTweets = async () => {
    const loadedTweets = await getTweets();
    setTweets(loadedTweets);
  };

  useEffect(() => {
    loadTweets();
    // Check if user exists in localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setShowLoginModal(false);
    }
  }, []);

  const handleLogin = (name: string) => {
    const newUser = { name };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setShowLoginModal(true);
  };

  const filteredTweets = tweets
    .filter(tweet => {
      const searchLower = searchQuery.toLowerCase();
      return tweet?.content?.toLowerCase().includes(searchLower) ||
             tweet?.prompt?.toLowerCase().includes(searchLower);
    })
    .sort((a, b) => {
      if (sortBy === 'latest') {
        return b.timestamp - a.timestamp;
      }
      return (b.likes + b.shares) - (a.likes + a.shares);
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Twitter className="text-blue-500 w-8 h-8" />
              <h1 className="text-xl font-bold">AI Twitter Clone</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search tweets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-blue-500 w-64"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular')}
                className="px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="latest">Latest</option>
                <option value="popular">Popular</option>
              </select>
              {user && (
                <div className="flex items-center space-x-2">
                  <UserCircle className="text-blue-500 w-6 h-6" />
                  <span className="text-sm font-medium">{user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TweetInput onTweetAdded={loadTweets} />
            <div className="space-y-4">
              {filteredTweets.map((tweet) => (
                <Tweet
                  key={tweet.id}
                  {...tweet}
                  onUpdate={loadTweets}
                />
              ))}
              {filteredTweets.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No tweets found. Try a different search term.</p>
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="bg-white rounded-lg shadow p-4 sticky top-24">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="text-blue-500" />
                <h2 className="text-lg font-semibold">Trending Topics</h2>
              </div>
              <div className="space-y-3">
                {['AI & Technology', 'Future of Work', 'Innovation', 'Digital Trends', 'Tech News'].map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setSearchQuery(topic)}
                    className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-gray-800">{topic}</p>
                    <p className="text-sm text-gray-500">Click to explore</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}

export default App;