import { User, Podcast, Comment, Notification } from '../types';

const STORAGE_KEYS = {
  USERS: 'podcast_pro_users',
  PODCASTS: 'podcast_pro_podcasts',
  COMMENTS: 'podcast_pro_comments',
  NOTIFICATIONS: 'podcast_pro_notifications',
  CURRENT_USER: 'podcast_pro_current_user'
};

// Generate 10 Test Users
const TEST_USERS: User[] = Array.from({ length: 10 }, (_, i) => {
  const num = i + 1;
  return {
    id: `user_test_${num}`,
    name: `User ${num}`,
    email: `${num}@a.c`,
    nickname: `@user${num}`,
    photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${num}`,
    role: 'user',
    savedPodcastIds: [],
    downloadedPodcastIds: [],
    followers: [],
    following: [],
    description: `Test account #${num} for social interactions.`
  };
});

// Initial Seed Data
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
    followers: [],
    following: [],
    description: 'System Administrator'
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
    followers: [],
    following: [],
    description: 'Podcast enthusiast'
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
      // First run
      this.set(STORAGE_KEYS.USERS, SEED_USERS);
    } else {
      // Migration: Ensure test users exist if they are missing
      let changed = false;
      
      // 1. Ensure structure is correct (migration for followers/following)
      users = users.map(u => ({
        ...u,
        followers: u.followers || [],
        following: u.following || []
      }));
      changed = true; // Always assume structure check might have touched something

      // 2. Inject Test Users if missing
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

  // --- Auth & User ---

  login(email: string): User | null {
    const users = this.get<User[]>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.email === email);
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  }

  register(name: string, email: string, nickname: string): User {
    const users = this.get<User[]>(STORAGE_KEYS.USERS);
    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email,
      nickname,
      photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      role: 'user',
      savedPodcastIds: [],
      downloadedPodcastIds: [],
      followers: [],
      following: [],
      description: 'New User'
    };
    users.push(newUser);
    this.set(STORAGE_KEYS.USERS, users);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
    return newUser;
  }

  getCurrentUser(): User | null {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!stored) return null;
    
    // Always fetch fresh data from the master list using ID, to prevent stale local storage state
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

  // --- Podcasts ---

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

  // --- Comments ---

  getComments(podcastId: string): Comment[] {
    const comments = this.get<Comment[]>(STORAGE_KEYS.COMMENTS);
    return comments.filter(c => c.podcastId === podcastId).sort((a, b) => b.createdAt - a.createdAt);
  }

  addComment(comment: Comment) {
    const comments = this.get<Comment[]>(STORAGE_KEYS.COMMENTS);
    comments.push(comment);
    this.set(STORAGE_KEYS.COMMENTS, comments);
    
    // Update count
    const podcasts = this.get<Podcast[]>(STORAGE_KEYS.PODCASTS);
    const podIdx = podcasts.findIndex(p => p.id === comment.podcastId);
    if (podIdx !== -1) {
      podcasts[podIdx].commentsCount++;
      this.set(STORAGE_KEYS.PODCASTS, podcasts);

      // Notify Author
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

  // --- Interactions ---

  toggleLike(userId: string, podcastId: string, isLiked: boolean) {
    const podcasts = this.get<Podcast[]>(STORAGE_KEYS.PODCASTS);
    const idx = podcasts.findIndex(p => p.id === podcastId);
    if (idx !== -1) {
      podcasts[idx].likesCount += isLiked ? 1 : -1;
      this.set(STORAGE_KEYS.PODCASTS, podcasts);

      // Notify Author on Like
      if (isLiked && podcasts[idx].authorId !== userId) {
        const liker = this.getUser(userId);
        this.createNotification(
          podcasts[idx].authorId,
          'New Like',
          `${liker?.name || 'Someone'} liked your podcast "${podcasts[idx].title}"`,
          'like',
          podcastId
        );
      }
    }
  }

  toggleSave(userId: string, podcastId: string): User | null {
    const users = this.get<User[]>(STORAGE_KEYS.USERS);
    const uIdx = users.findIndex(u => u.id === userId);

    // Fetch podcast to get author and update stats
    const podcasts = this.get<Podcast[]>(STORAGE_KEYS.PODCASTS);
    const podIdx = podcasts.findIndex(p => p.id === podcastId);
    const podcast = podIdx !== -1 ? podcasts[podIdx] : null;

    if (uIdx !== -1) {
      const user = users[uIdx];
      let isSaving = false;

      if (user.savedPodcastIds.includes(podcastId)) {
        // Unsave
        user.savedPodcastIds = user.savedPodcastIds.filter(id => id !== podcastId);
        
        // Update stats
        if (podcast && podcast.savedCount > 0) {
            podcast.savedCount--;
        }
      } else {
        // Save
        user.savedPodcastIds.push(podcastId);
        isSaving = true;

        // Update stats
        if (podcast) {
            podcast.savedCount = (podcast.savedCount || 0) + 1;
        }
      }
      
      this.set(STORAGE_KEYS.USERS, users);
      if (podcast) this.set(STORAGE_KEYS.PODCASTS, podcasts);
      
      // Update session storage immediately
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

      // Notify Author
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

      // Init arrays if undefined (legacy data safety)
      if (!currentUser.following) currentUser.following = [];
      if (!targetUser.followers) targetUser.followers = [];

      const isFollowing = currentUser.following.includes(targetUserId);

      if (isFollowing) {
        // Unfollow
        currentUser.following = currentUser.following.filter(id => id !== targetUserId);
        targetUser.followers = targetUser.followers.filter(id => id !== currentUserId);
      } else {
        // Follow
        currentUser.following.push(targetUserId);
        targetUser.followers.push(currentUserId);
        
        // Notify Target
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

  // --- Notifications ---

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
    notifications.unshift(newNotif); // Add to beginning
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

  // --- Admin ---
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