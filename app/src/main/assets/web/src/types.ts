export interface Comment {
  id: string;
  podcastId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: number;
}

export interface Podcast {
  id: string;
  title: string;
  description: string;
  category: string;
  videoUrl: string;
  thumbnailUrl: string;
  authorId: string;
  authorName: string;
  likesCount: number;
  commentsCount: number;
  savedCount: number;
  createdAt: number;
}

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  date: number;
  read: boolean;
  type: 'system' | 'like' | 'follow' | 'comment' | 'save';
  relatedId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  nickname: string;
  photoUrl: string;
  role: 'user' | 'admin';
  savedPodcastIds: string[];
  downloadedPodcastIds: string[];
  likedPodcastIds: string[];
  followers: string[];
  following: string[];
  description?: string;
  passwordHash?: string;
}

export type ViewState = 
  | { type: 'LOGIN' }
  | { type: 'REGISTER' }
  | { type: 'PODCAST_LIST' }
  | { type: 'PODCAST_DETAIL'; podcastId: string }
  | { type: 'ADD_PODCAST' }
  | { type: 'DOWNLOADS' }
  | { type: 'NOTIFICATIONS' }
  | { type: 'PROFILE'; userId: string }
  | { type: 'ADMIN_PANEL' };
