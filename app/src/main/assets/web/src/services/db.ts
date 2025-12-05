import { User, Podcast, Comment, Notification } from '../types';

const STORAGE_KEYS = {
  USERS: 'podcast_pro_users',
  PODCASTS: 'podcast_pro_podcasts',
  COMMENTS: 'podcast_pro_comments',
  NOTIFICATIONS: 'podcast_pro_notifications',
  CURRENT_USER: 'podcast_pro_current_user'
};

const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36);
};

const TEST_USERS: User[] = Array.from({ length: 10 }, (_, i) => {
  const num = i + 1;
  return {
    id: `user_test_${num}`,
    name: `User ${num}`,
    email: `${num}@a.c`,
    nickname: `@user${num}`,
    photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${num}`,
    role: 'user' as const,
    savedPodcastIds: [],
    downloadedPodcastIds: [],
    likedPodcastIds: [],
    followers: [],
    following: [],
    description: `Test account #${num} for social interactions.`,
    passwordHash: simpleHash('password')
  };
});

const SEED_USERS: User[] = [
  {
    id: 'admin_1',
    name: 'System Admin',
    email: 'admin',
    nickname: '@admin',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    role: 'admin',
    savedPodcastIds: [],
    downloadedPodcastIds: [],
    likedPodcastIds: [],
    followers: [],
    following: [],
    description: 'System Administrator',
    passwordHash: simpleHash('admin')
  },
  {
    id: 'user_1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    nickname: '@janed',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
    role: 'user',
    savedPodcastIds: [],
    downloadedPodcastIds: [],
    likedPodcastIds: [],
    followers: [],
    following: [],
    description: 'Podcast enthusiast',
    passwordHash: simpleHash('password')
  },
  ...TEST_USERS
];

const SEED_PODCASTS: Podcast[] = [
  {
    id: 'pod_1',
    title: 'The Future of AI',
    description: 'Exploring how generative AI is reshaping software development and creativity.',
    category: 'Technology',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/tech/800/450',
    authorId: 'user_1',
    authorName: 'Jane Doe',
    likesCount: 120,
    commentsCount: 5,
    savedCount: 10,
    createdAt: Date.now() - 10000000
  },
  {
    id: 'pod_2',
    title: 'Morning Meditation',
    description: 'Start your day with this 10-minute guided meditation session.',
    category: 'Relaxation',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/relax/800/450',
    authorId: 'user_1',
    authorName: 'Jane Doe',
    likesCount: 85,
    commentsCount: 2,
    savedCount: 45,
    createdAt: Date.now() - 5000000
  }
];

class Database {
  constructor() {
    this.init();
  }

  private init() {
    let users = this.get<User[]>(STORAGE_KEYS.USERS);

    if (users.length === 0) {
      this.set(STORAGE_KEYS.USERS, SEED_USERS);
    } else {
      let changed = false;
      
      users = users.map(u => ({
        ...u,
        followers: u.followers || [],
        following: u.following || [],
        likedPodcastIds: u.likedPodcastIds || [],
        passwordHash: u.passwordHash || simpleHash('password')
      }));
      changed = true;

      TEST_USERS.forEach(testUser => {
          if (!users.find(u => u.id === testUser.id)) {
              users.push(testUser);
              changed = true;
          }
      });

      if (changed) {
        this.set(STORAGE_KEYS.USERS, users);
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.PODCASTS)) {
      localStorage.setItem(STORAGE_KEYS.PODCASTS, JSON.stringify(SEED_PODCASTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([
        { 
          id: 'n1', 
          recipientId: 'user_1',
          title: 'Welcome!', 
          message: 'Thanks for joining Podcast Pro.', 
          date: Date.now(), 
          read: false,
          type: 'system' 
        }
      ]));
    }
  }

  private get<T>(key: string): T {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  private set(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  login(email: string, password: string): User | null {
    if (!email || !password) return null;
    
    const users = this.get<User[]>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.email === email);
    
    if (!user) return null;
    
    const inputHash = simpleHash(password);
    if (user.passwordHash !== inputHash) return null;
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  }

  register(name: string, email: string, nickname: string, password: string): User | { error: string } {
    if (!name || !email || !nickname || !password) {
      return { error: 'All fields are required' };
    }
    
    if (password.length < 4) {
      return { error: 'Password must be at least 4 characters' };
    }
    
    const users = this.get<User[]>(STORAGE_KEYS.USERS);
    
    if (users.find(u => u.email === email)) {
      return { error: 'Email already registered' };
    }
    
    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email,
      nickname,
      photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      role: 'user',
      savedPodcastIds: [],
      downloadedPodcastIds: [],
      likedPodcastIds: [],
      followers: [],
      following: [],
      description: 'New User',
      passwordHash: simpleHash(password)
    };
    users.push(newUser);
    this.set(STORAGE_KEYS.USERS, users);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
    return newUser;
  }

  getCurrentUser(): User | null {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!stored) return null;
    const parsedStored = JSON.parse(stored) as User;
    return this.getUser(parsedStored.id) || null;
  }

  getUser(id: string): User | undefined {
    const users = this.get<User[]>(STORAGE_KEYS.USERS);
    return users.find(u => u.id === id);
  }

  logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  getPodcasts(): Podcast[] {
    return this.get<Podcast[]>(STORAGE_KEYS.PODCASTS).sort((a, b) => b.createdAt - a.createdAt);
  }

  getUserPodcasts(userId: string): Podcast[] {
    return this.getPodcasts().filter(p => p.authorId === userId);
  }

  getPodcast(id: string): Podcast | undefined {
    return this.getPodcasts().find(p => p.id === id);
  }

  addPodcast(podcast: Podcast) {
    const podcasts = this.get<Podcast[]>(STORAGE_KEYS.PODCASTS);
    podcasts.push(podcast);
    this.set(STORAGE_KEYS.PODCASTS, podcasts);
  }

  deletePodcast(id: string) {
    let podcasts = this.get<Podcast[]>(STORAGE_KEYS.PODCASTS);
    podcasts = podcasts.filter(p => p.id !== id);
    this.set(STORAGE_KEYS.PODCASTS, podcasts);
  }

  getComments(podcastId: string): Comment[] {
    const comments = this.get<Comment[]>(STORAGE_KEYS.COMMENTS);
    return comments.filter(c => c.podcastId === podcastId).sort((a, b) => b.createdAt - a.createdAt);
  }

  addComment(comment: Comment) {
    const comments = this.get<Comment[]>(STORAGE_KEYS.COMMENTS);
    comments.push(comment);
    this.set(STORAGE_KEYS.COMMENTS, comments);
    
    const podcasts = this.get<Podcast[]>(STORAGE_KEYS.PODCASTS);
    const podIdx = podcasts.findIndex(p => p.id === comment.podcastId);
    if (podIdx !== -1) {
      podcasts[podIdx].commentsCount++;
      this.set(STORAGE_KEYS.PODCASTS, podcasts);

      if (podcasts[podIdx].authorId !== comment.authorId) {
        this.createNotification(
          podcasts[podIdx].authorId,
          'New Comment',
          `${comment.authorName} commented on "${podcasts[podIdx].title}"`,
          'comment',
          podcasts[podIdx].id
        );
      }
    }
  }

  isLikedByUser(userId: string, podcastId: string): boolean {
    const user = this.getUser(userId);
    return user?.likedPodcastIds?.includes(podcastId) || false;
  }

  toggleLike(userId: string, podcastId: string): User | null {
    const users = this.get<User[]>(STORAGE_KEYS.USERS);
    const uIdx = users.findIndex(u => u.id === userId);
    
    if (uIdx === -1) return null;
    
    const user = users[uIdx];
    if (!user.likedPodcastIds) user.likedPodcastIds = [];
    
    const podcasts = this.get<Podcast[]>(STORAGE_KEYS.PODCASTS);
    const podIdx = podcasts.findIndex(p => p.id === podcastId);
    
    if (podIdx === -1) return null;
    
    const podcast = podcasts[podIdx];
    const wasLiked = user.likedPodcastIds.includes(podcastId);
    
    if (wasLiked) {
      user.likedPodcastIds = user.likedPodcastIds.filter(id => id !== podcastId);
      podcast.likesCount = Math.max(0, podcast.likesCount - 1);
    } else {
      user.likedPodcastIds.push(podcastId);
      podcast.likesCount++;
      
      if (podcast.authorId !== userId) {
        this.createNotification(
          podcast.authorId,
          'New Like',
          `${user.name} liked your podcast "${podcast.title}"`,
          'like',
          podcastId
        );
      }
    }
    
    this.set(STORAGE_KEYS.USERS, users);
    this.set(STORAGE_KEYS.PODCASTS, podcasts);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    
    return user;
  }

  toggleSave(userId: string, podcastId: string): User | null {
    const users = this.get<User[]>(STORAGE_KEYS.USERS);
    const uIdx = users.findIndex(u => u.id === userId);

    const podcasts = this.get<Podcast[]>(STORAGE_KEYS.PODCASTS);
    const podIdx = podcasts.findIndex(p => p.id === podcastId);
    const podcast = podIdx !== -1 ? podcasts[podIdx] : null;

    if (uIdx !== -1) {
      const user = users[uIdx];
      let isSaving = false;

      if (user.savedPodcastIds.includes(podcastId)) {
        user.savedPodcastIds = user.savedPodcastIds.filter(id => id !== podcastId);
        if (podcast && podcast.savedCount > 0) {
            podcast.savedCount--;
        }
      } else {
        user.savedPodcastIds.push(podcastId);
        isSaving = true;
        if (podcast) {
            podcast.savedCount = (podcast.savedCount || 0) + 1;
        }
      }
      
      this.set(STORAGE_KEYS.USERS, users);
      if (podcast) this.set(STORAGE_KEYS.PODCASTS, podcasts);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

      if (isSaving && podcast && podcast.authorId !== userId) {
          this.createNotification(
              podcast.authorId,
              'New Save',
              `${user.name} saved your podcast "${podcast.title}"`,
              'save',
              podcastId
          );
      }

      return user;
    }
    return null;
  }

  toggleDownload(userId: string, podcastId: string): User | null {
    const users = this.get<User[]>(STORAGE_KEYS.USERS);
    const uIdx = users.findIndex(u => u.id === userId);
    if (uIdx !== -1) {
      const user = users[uIdx];
      if (user.downloadedPodcastIds.includes(podcastId)) {
        user.downloadedPodcastIds = user.downloadedPodcastIds.filter(id => id !== podcastId);
      } else {
        user.downloadedPodcastIds.push(podcastId);
      }
      this.set(STORAGE_KEYS.USERS, users);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  }

  toggleFollow(currentUserId: string, targetUserId: string): User | null {
    const users = this.get<User[]>(STORAGE_KEYS.USERS);
    const currentUserIdx = users.findIndex(u => u.id === currentUserId);
    const targetUserIdx = users.findIndex(u => u.id === targetUserId);

    if (currentUserIdx !== -1 && targetUserIdx !== -1) {
      const currentUser = users[currentUserIdx];
      const targetUser = users[targetUserIdx];

      if (!currentUser.following) currentUser.following = [];
      if (!targetUser.followers) targetUser.followers = [];

      const isFollowing = currentUser.following.includes(targetUserId);

      if (isFollowing) {
        currentUser.following = currentUser.following.filter(id => id !== targetUserId);
        targetUser.followers = targetUser.followers.filter(id => id !== currentUserId);
      } else {
        currentUser.following.push(targetUserId);
        targetUser.followers.push(currentUserId);
        this.createNotification(
            targetUserId,
            'New Follower',
            `${currentUser.name} started following you.`,
            'follow',
            currentUserId
        );
      }

      this.set(STORAGE_KEYS.USERS, users);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      return currentUser;
    }
    return null;
  }

  createNotification(recipientId: string, title: string, message: string, type: Notification['type'], relatedId?: string) {
    const notifications = this.get<Notification[]>(STORAGE_KEYS.NOTIFICATIONS);
    const newNotif: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recipientId,
      title,
      message,
      date: Date.now(),
      read: false,
      type,
      relatedId
    };
    notifications.unshift(newNotif);
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  getNotifications(userId: string): Notification[] {
    const all = this.get<Notification[]>(STORAGE_KEYS.NOTIFICATIONS);
    return all.filter(n => n.recipientId === userId).sort((a, b) => b.date - a.date);
  }

  getUnreadCount(userId: string): number {
    return this.getNotifications(userId).filter(n => !n.read).length;
  }

  markAsRead(userId: string, notificationId: string) {
    const notifications = this.get<Notification[]>(STORAGE_KEYS.NOTIFICATIONS);
    const idx = notifications.findIndex(n => n.id === notificationId && n.recipientId === userId);
    if (idx !== -1) {
      notifications[idx].read = true;
      this.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
    }
  }

  markAllAsRead(userId: string) {
    const notifications = this.get<Notification[]>(STORAGE_KEYS.NOTIFICATIONS);
    const updated = notifications.map(n => n.recipientId === userId ? { ...n, read: true } : n);
    this.set(STORAGE_KEYS.NOTIFICATIONS, updated);
  }

  getAllUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS);
  }

  deleteUser(id: string) {
    let users = this.get<User[]>(STORAGE_KEYS.USERS);
    users = users.filter(u => u.id !== id);
    this.set(STORAGE_KEYS.USERS, users);
  }
}

export const DB = new Database();
