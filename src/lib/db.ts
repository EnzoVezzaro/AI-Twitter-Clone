import { openDB, DBSchema } from 'idb';

interface Tweet {
  id: string;
  content: string;
  prompt: string;
  timestamp: number;
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

export async function addTweet(tweet: Tweet) {
  const db = await dbPromise;
  return db.add('tweets', tweet);
}

export async function getTweets() {
  const db = await dbPromise;
  return db.getAllFromIndex('tweets', 'by-timestamp');
}

export async function updateTweet(tweet: Tweet) {
  const db = await dbPromise;
  return db.put('tweets', tweet);
}

export async function addComment(comment: Comment) {
  const db = await dbPromise;
  return db.add('comments', comment);
}

export async function getComments(tweetId: string) {
  const db = await dbPromise;
  return db.getAllFromIndex('comments', 'by-tweet', tweetId);
}