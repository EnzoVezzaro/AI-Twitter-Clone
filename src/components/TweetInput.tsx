import React, { useState } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { generateTweet } from '../lib/ai';
import { addTweet } from '../lib/db';

interface TweetInputProps {
  onTweetAdded: () => void;
  user: string;
}

export function TweetInput({ onTweetAdded, user }: TweetInputProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions] = useState([
    'AI is changing the game!',
    'Remote work: Productivity hack or burnout trap?',
    'The digital revolution is here! Are you ready?',
    'Can technology save the planet?'
  ]);    

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
  
    setIsGenerating(true);
    try {
      const content = await generateTweet(prompt) ?? "Default tweet content if generation fails.";
      await addTweet({
        id: crypto.randomUUID(),
        content,
        prompt,
        user: user,
        timestamp: Date.now(),
        likes: 0,
        shares: 0,
      });
      setPrompt('');
      onTweetAdded();
    } catch (error) {
      console.error('Failed to generate tweet:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a topic for AI to tweet about..."
                className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500"
                disabled={isGenerating}
              />
            </div>
            <button
              type="submit"
              disabled={isGenerating}
              className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:hover:bg-blue-500"
            >
              {isGenerating ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles size={16} className="text-blue-500" />
              <span className="text-sm text-gray-600">Try these tweets:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setPrompt(suggestion)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>
      {isGenerating && (
        <p className="text-sm text-gray-500 mt-2 animate-pulse">
          AI is crafting your tweet...
        </p>
      )}
    </div>
  );
}