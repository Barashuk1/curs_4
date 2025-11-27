import { User, Podcast, Comment, Notification } from '../types';

// Initial Mock Data
const MOCK_USERS: User[] = [
  {
    id: 'admin_1',
    name: 'Super Admin',
    nickname: '@admin',
    email: 'admin', // Simplified for the "admin" login requirement
    description: 'System Administrator',
    role: 'admin',
    savedPodcastIds: [],
    downloadedPodcastIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    photoUrl: 'https://ui-avatars.com/api/?name=Admin&background=ef4444&color=fff'
  },
  {
    id: 'user_1',
    name: 'Jane Doe',
    nickname: '@jane_d',
    email: 'jane@example.com',
    description: 'Podcast Enthusiast',
    role: 'user',
    savedPodcastIds: ['pod_1'],
    downloadedPodcastIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    photoUrl: 'https://picsum.photos/201'
  },
  {
    id: 'user_2',
    name: 'John Smith',
    nickname: '@johnny_s',
    email: 'john@example.com',
    description: 'Music Lover',
    role: 'user',
    savedPodcastIds: [],
    downloadedPodcastIds: [],
    createdAt: Date.now() - 100000,
    updatedAt: Date.now(),
    photoUrl: 'https://picsum.photos/202'
  }
];

const MOCK_PODCASTS: Podcast[] = [
  {
    id: 'pod_1',
    title: 'The Future of AI',
    description: 'Discussing the impact of Gemini and LLMs on modern development.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://picsum.photos/800/450',
    authorId: 'admin_1',
    authorName: 'Admin User',
    likesCount: 120,
    commentsCount: 5,
    savedCount: 10,
    createdAt: Date.now(),
    category: 'Technology'
  },
  {
    id: 'pod_2',
    title: 'Nature Sounds ASMR',
    description: 'Relaxing sounds from the deep forest.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl: 'https://picsum.photos/800/451',
    authorId: 'user_1',
    authorName: 'Jane Doe',
    likesCount: 45,
    commentsCount: 2,
    savedCount: 3,
    createdAt: Date.now() - 10000000,
    category: 'Relaxation'
  }
];

const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    podcastId: 'pod_1',
    authorId: 'user_1',
    authorName: 'Jane Doe',
    text: 'Great insights on the new models!',
    createdAt: Date.now()
  }
];

const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 'n1', title: 'Welcome!', message: 'Thanks for joining Podcast Pro.', date: Date.now(), read: false },
    { id: 'n2', title: 'New Feature', message: 'You can now download episodes.', date: Date.now() - 500000, read: true }
];

// LocalStorage Keys
const STORAGE_KEYS = {
  USERS: 'podcast_app_users',
  PODCASTS: 'podcast_app_podcasts',
  COMMENTS: 'podcast_app_comments',
  CURRENT_USER: 'podcast_app_current_user'
};

// Helper to load/save
const load = <T>(key: string, defaultData: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultData;
  return JSON.parse(stored);
};

const save = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const DB = {
  // Auth
  login: (email: string): User | null => {
    const users = load<User[]>(STORAGE_KEYS.USERS, MOCK_USERS);
    // Strict equality for email to handle simple 'admin' string
    const user = users.find(u => u.email === email);
    if (user) {
      save(STORAGE_KEYS.CURRENT_USER, user);
      return user;
    }
    return null;
  },

  register: (name: string, email: string, nickname: string): User => {
    const users = load<User[]>(STORAGE_KEYS.USERS, MOCK_USERS);
    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email,
      nickname,
      role: 'user',
      description: 'New listener',
      savedPodcastIds: [],
      downloadedPodcastIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      photoUrl: `https://picsum.photos/seed/${Date.now()}/200`
    };
    users.push(newUser);
    save(STORAGE_KEYS.USERS, users);
    save(STORAGE_KEYS.CURRENT_USER, newUser);
    return newUser;
  },

  getCurrentUser: (): User | null => {
    return load<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  updateUser: (user: User) => {
    const users = load<User[]>(STORAGE_KEYS.USERS, MOCK_USERS);
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
      save(STORAGE_KEYS.USERS, users);
      save(STORAGE_KEYS.CURRENT_USER, user);
    }
  },

  // Admin Features
  getAllUsers: (): User[] => {
    return load<User[]>(STORAGE_KEYS.USERS, MOCK_USERS);
  },

  deleteUser: (userId: string) => {
    let users = load<User[]>(STORAGE_KEYS.USERS, MOCK_USERS);
    users = users.filter(u => u.id !== userId);
    save(STORAGE_KEYS.USERS, users);
  },

  // Podcasts
  getPodcasts: (): Podcast[] => {
    return load<Podcast[]>(STORAGE_KEYS.PODCASTS, MOCK_PODCASTS);
  },

  getPodcast: (id: string): Podcast | undefined => {
    const podcasts = load<Podcast[]>(STORAGE_KEYS.PODCASTS, MOCK_PODCASTS);
    return podcasts.find(p => p.id === id);
  },

  addPodcast: (podcast: Podcast) => {
    const podcasts = load<Podcast[]>(STORAGE_KEYS.PODCASTS, MOCK_PODCASTS);
    podcasts.unshift(podcast);
    save(STORAGE_KEYS.PODCASTS, podcasts);
  },

  deletePodcast: (id: string) => {
    let podcasts = load<Podcast[]>(STORAGE_KEYS.PODCASTS, MOCK_PODCASTS);
    podcasts = podcasts.filter(p => p.id !== id);
    save(STORAGE_KEYS.PODCASTS, podcasts);
  },

  toggleLike: (podcastId: string, increment: boolean) => {
    const podcasts = load<Podcast[]>(STORAGE_KEYS.PODCASTS, MOCK_PODCASTS);
    const index = podcasts.findIndex(p => p.id === podcastId);
    if (index !== -1) {
      podcasts[index].likesCount += increment ? 1 : -1;
      save(STORAGE_KEYS.PODCASTS, podcasts);
    }
  },

  toggleSave: (userId: string, podcastId: string) => {
     const users = load<User[]>(STORAGE_KEYS.USERS, MOCK_USERS);
     const userIndex = users.findIndex(u => u.id === userId);
     const podcasts = load<Podcast[]>(STORAGE_KEYS.PODCASTS, MOCK_PODCASTS);
     const podIndex = podcasts.findIndex(p => p.id === podcastId);

     if (userIndex !== -1 && podIndex !== -1) {
        const user = users[userIndex];
        const isSaved = user.savedPodcastIds.includes(podcastId);
        
        if (isSaved) {
            user.savedPodcastIds = user.savedPodcastIds.filter(id => id !== podcastId);
            podcasts[podIndex].savedCount--;
        } else {
            user.savedPodcastIds.push(podcastId);
            podcasts[podIndex].savedCount++;
        }
        
        save(STORAGE_KEYS.USERS, users);
        save(STORAGE_KEYS.PODCASTS, podcasts);
        
        // Update current session
        const currentUser = load<User | null>(STORAGE_KEYS.CURRENT_USER, null);
        if (currentUser && currentUser.id === userId) {
            save(STORAGE_KEYS.CURRENT_USER, user);
        }
     }
  },

  toggleDownload: (userId: string, podcastId: string) => {
    const users = load<User[]>(STORAGE_KEYS.USERS, MOCK_USERS);
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex !== -1) {
       const user = users[userIndex];
       const isDownloaded = user.downloadedPodcastIds.includes(podcastId);
       
       if (isDownloaded) {
           user.downloadedPodcastIds = user.downloadedPodcastIds.filter(id => id !== podcastId);
       } else {
           user.downloadedPodcastIds.push(podcastId);
       }
       
       save(STORAGE_KEYS.USERS, users);
       
       const currentUser = load<User | null>(STORAGE_KEYS.CURRENT_USER, null);
       if (currentUser && currentUser.id === userId) {
           save(STORAGE_KEYS.CURRENT_USER, user);
       }
    }
  },

  // Comments
  getComments: (podcastId: string): Comment[] => {
    const comments = load<Comment[]>(STORAGE_KEYS.COMMENTS, MOCK_COMMENTS);
    return comments.filter(c => c.podcastId === podcastId).sort((a, b) => b.createdAt - a.createdAt);
  },

  addComment: (comment: Comment) => {
    const comments = load<Comment[]>(STORAGE_KEYS.COMMENTS, MOCK_COMMENTS);
    comments.push(comment);
    save(STORAGE_KEYS.COMMENTS, comments);

    // Update count
    const podcasts = load<Podcast[]>(STORAGE_KEYS.PODCASTS, MOCK_PODCASTS);
    const index = podcasts.findIndex(p => p.id === comment.podcastId);
    if (index !== -1) {
      podcasts[index].commentsCount++;
      save(STORAGE_KEYS.PODCASTS, podcasts);
    }
  },

  // Notifications
  getNotifications: (): Notification[] => {
      return MOCK_NOTIFICATIONS;
  }
};