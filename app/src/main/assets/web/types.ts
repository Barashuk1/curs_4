export type Role = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  nickname: string;
  email: string;
  description: string;
  photoUrl?: string;
  role: Role;
  savedPodcastIds: string[];
  downloadedPodcastIds: string[]; // New field for downloads
  createdAt: number;
  updatedAt: number;
}

export interface Podcast {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  authorId: string;
  authorName: string;
  likesCount: number;
  commentsCount: number;
  savedCount: number;
  createdAt: number;
  category: string;
}

export interface Comment {
  id: string;
  podcastId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: number;
  read: boolean;
}

export type ViewState = 
  | { type: 'LOGIN' }
  | { type: 'REGISTER' }
  | { type: 'PODCAST_LIST' }
  | { type: 'PODCAST_DETAIL'; podcastId: string }
  | { type: 'ADD_PODCAST' }
  | { type: 'DOWNLOADS' } // New View
  | { type: 'NOTIFICATIONS' } // New View
  | { type: 'PROFILE'; userId?: string }
  | { type: 'ADMIN_PANEL' };