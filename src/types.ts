export interface Tweet {
  id: string;
  content: string;
  prompt: string;
  timestamp: number;
  likes: number;
  shares: number;
}

export interface Comment {
  id: string;
  tweetId: string;
  content: string;
  timestamp: number;
}

export interface User {
  name: string;
}