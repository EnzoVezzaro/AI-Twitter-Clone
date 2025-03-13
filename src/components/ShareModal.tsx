import React from 'react';
import { X, Facebook, Twitter, Linkedin as LinkedIn, Link2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tweet: {
    content: string;
  };
}

export function ShareModal({ isOpen, onClose, tweet }: ShareModalProps) {
  if (!isOpen) return null;

  const shareUrl = window.location.href;
  const encodedText = encodeURIComponent(tweet.content);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodedText}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodedText}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tweet.content);
      alert('Tweet copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Share Tweet</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors w-full"
          >
            <Twitter className="text-[#1DA1F2]" size={24} />
            <span>Share on Twitter</span>
          </a>

          <a
            href={shareLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors w-full"
          >
            <Facebook className="text-[#4267B2]" size={24} />
            <span>Share on Facebook</span>
          </a>

          <a
            href={shareLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors w-full"
          >
            <LinkedIn className="text-[#0077B5]" size={24} />
            <span>Share on LinkedIn</span>
          </a>

          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors w-full"
          >
            <Link2 className="text-gray-600" size={24} />
            <span>Copy to clipboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}