import { openDB, DBSchema } from 'idb';
import { broadcastUpdate } from './p2p';

interface Tweet {
  id: string;
  content: string;
  prompt: string;
  timestamp: number;
  user: string;
  likes: number;
  shares: number;
}

interface Comment {
  id: string;
  tweetId: string;
  content: string;
  timestamp: number;
}

interface MyDB extends DBSchema {
  tweets: {
    key: string;
    value: Tweet;
    indexes: { 'by-timestamp': number };
  };
  comments: {
    key: string;
    value: Comment;
    indexes: { 'by-tweet': string };
  };
}

const dbPromise = openDB<MyDB>('twitter-clone', 1, {
  upgrade(db) {
    const tweetStore = db.createObjectStore('tweets', { keyPath: 'id' });
    tweetStore.createIndex('by-timestamp', 'timestamp');

    const commentStore = db.createObjectStore('comments', { keyPath: 'id' });
    commentStore.createIndex('by-tweet', 'tweetId');
  },
});

// Listen for updates from other peers
export async function receivedData(data: any) {
  return new Promise((resolve) => {
    dbPromise.then((db) => {
      if (data.type === 'tweet') {
        db.put('tweets', data);
      } else if (data.type === 'comment') {
        db.put('comments', data);
      }
      resolve('OK');
    });
  });
}

// Add a new tweet and share with peers
export async function addTweet(tweet: Tweet) {
  const db = await dbPromise;
  await db.add('tweets', tweet);

  // Broadcast the new tweet to other clients
  broadcastUpdate({ ...tweet, type: 'tweet' }); 
}

// Get tweets ordered by timestamp
export async function getTweets() {
  const db = await dbPromise;
  return db.getAllFromIndex('tweets', 'by-timestamp');
}

// Update an existing tweet and notify others
export async function updateTweet(tweet: Tweet) {
  const db = await dbPromise;
  await db.put('tweets', tweet);

  // Notify other peers
  broadcastUpdate({ ...tweet, type: 'tweet' });
}

// Add a new comment and share with peers
export async function addComment(comment: Comment) {
  const db = await dbPromise;
  await db.add('comments', comment);
  // Broadcast the new comment to other clients
  broadcastUpdate({ ...comment, type: 'comment' });
}

// Get comments for a specific tweet
export async function getComments(tweetId: string) {
  const db = await dbPromise;
  return db.getAllFromIndex('comments', 'by-tweet', tweetId);
}
