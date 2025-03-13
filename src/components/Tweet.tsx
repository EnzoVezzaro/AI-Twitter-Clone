import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { updateTweet, getComments, addComment } from '../lib/db';
import { ShareModal } from './ShareModal';
import type { Comment } from '../types';

interface TweetProps {
  id: string;
  content: string;
  prompt: string;
  timestamp: number;
  likes: number;
  shares: number;
  onUpdate: () => void;
}

export function Tweet({ id, content, prompt, timestamp, likes, shares, onUpdate }: TweetProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments]);

  const loadComments = async () => {
    const tweetComments = await getComments(id);
    setComments(tweetComments);
  };

  const handleLike = async () => {
    setIsLiked(!isLiked);
    await updateTweet({
      id,
      content,
      prompt,
      timestamp,
      likes: isLiked ? likes - 1 : likes + 1,
      shares,
    });
    onUpdate();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Generated Tweet',
          text: content,
        });
        await updateTweet({
          id,
          content,
          prompt,
          timestamp,
          likes,
          shares: shares + 1,
        });
        onUpdate();
      } catch (error) {
        console.log('Error sharing:', error);
        setShowShareModal(true);
      }
    } else {
      setShowShareModal(true);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await addComment({
      id: crypto.randomUUID(),
      tweetId: id,
      content: newComment,
      timestamp: Date.now(),
    });
    setNewComment('');
    loadComments();
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-start space-x-2 mb-2">
        <Sparkles className="text-blue-500 w-5 h-5 mt-1" />
        <div className="flex-1">
          <p className="text-gray-800">{content}</p>
          <div className="text-sm text-gray-500 mt-1 flex items-center space-x-2">
            <span>{formatDistanceToNow(timestamp, { addSuffix: true })}</span>
            <span>•</span>
            <span className="text-blue-500">AI Generated</span>
            <span>•</span>
            <span className="italic">Topic: {prompt}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-6 border-t border-gray-200 pt-4">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 ${
            isLiked ? 'text-red-500' : 'text-gray-500'
          } hover:text-red-500 transition-colors group`}
        >
          <Heart
            size={20}
            fill={isLiked ? 'currentColor' : 'none'}
            className="group-hover:animate-pulse"
          />
          <span>{likes}</span>
        </button>
        
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
        >
          <MessageCircle size={20} />
          <span>{comments.length}</span>
        </button>
        
        <button
          onClick={handleShare}
          className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors"
        >
          <Share2 size={20} />
          <span>{shares}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <form onSubmit={handleAddComment} className="mb-4">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500"
            />
          </form>
          
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-800">{comment.content}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
                </p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      )}

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        tweet={{ content }}
      />
    </div>
  );
}