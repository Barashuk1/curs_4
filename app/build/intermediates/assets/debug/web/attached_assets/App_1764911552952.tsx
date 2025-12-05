import React, { useState, useEffect } from 'react';
import { ViewState, User, Podcast, Notification } from './types';
import { DB } from './services/db';
import { Layout } from './components/Layout';
import { generatePodcastDescription } from './services/geminiService';
import { 
  Play, Heart, MessageSquare, Bookmark, Share2, 
  Search, Trash2, Video, Send, Loader2, Sparkles, X,
  Download, CheckCircle, Shield, UserX, BellRing, Users,
  UserPlus, UserCheck, Mic, UploadCloud, Youtube
} from 'lucide-react';

// --- Helper Functions ---

const getYouTubeEmbedId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// --- Sub-components for pages ---

// 1. Auth Screen
const AuthScreen: React.FC<{ 
    mode: 'LOGIN' | 'REGISTER', 
    onSwitch: () => void, 
    onSuccess: (u: User) => void 
}> = ({ mode, onSwitch, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  
  // New: Admin Toggle
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isAdminLogin) {
        if (email === 'admin' && password === 'admin') {
            const adminUser = DB.login('admin'); // Uses the simplified 'admin' email in mock DB
            if (adminUser) onSuccess(adminUser);
            else setError('System error: Admin user not found in DB');
        } else {
            setError('Invalid Admin credentials');
        }
        return;
    }

    if (mode === 'LOGIN') {
      const user = DB.login(email);
      if (user) onSuccess(user);
      else setError('Invalid credentials');
    } else {
      if (!name || !nickname) {
          setError('All fields are required');
          return;
      }
      const user = DB.register(name, email, nickname);
      onSuccess(user);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full max-w-xs mx-auto animate-in fade-in zoom-in duration-300">
      <div className="mb-6 text-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
            {isAdminLogin ? <Shield className="text-white" size={32} /> : <Video className="text-white" size={32} />}
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
            {isAdminLogin ? 'Admin Access' : (mode === 'LOGIN' ? 'Welcome Back' : 'Join Podcast Pro')}
        </h2>
        <p className="text-zinc-400 text-sm">
            {isAdminLogin 
                ? 'Restricted area. Authorized personnel only.' 
                : (mode === 'LOGIN' ? 'Enter your details to access your feed.' : 'Create an account to start streaming.')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {mode === 'REGISTER' && !isAdminLogin && (
            <>
                <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                <input type="text" placeholder="Nickname (@handle)" value={nickname} onChange={e => setNickname(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
            </>
        )}
        
        <input 
            type={isAdminLogin ? "text" : "email"} 
            placeholder={isAdminLogin ? "Admin Login" : "Email"} 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500" 
        />
        <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500" 
        />
        
        {error && <p className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded">{error}</p>}

        <button type="submit" className={`w-full font-semibold py-3 rounded-lg transition-all active:scale-95 ${isAdminLogin ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
          {isAdminLogin ? 'Enter Panel' : (mode === 'LOGIN' ? 'Sign In' : 'Sign Up')}
        </button>
      </form>

      <div className="mt-6 flex flex-col items-center space-y-4">
        {!isAdminLogin && (
            <p className="text-zinc-500 text-sm">
            {mode === 'LOGIN' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={onSwitch} className="text-indigo-400 hover:underline font-medium">
                {mode === 'LOGIN' ? 'Sign Up' : 'Sign In'}
            </button>
            </p>
        )}
        
        {/* Admin Toggle */}
        <button 
            onClick={() => {
                setIsAdminLogin(!isAdminLogin);
                setError('');
                setEmail('');
                setPassword('');
            }}
            className="text-xs text-zinc-600 hover:text-zinc-400 font-medium border-b border-zinc-800 pb-0.5"
        >
            {isAdminLogin ? '← Back to User Login' : 'I am admin'}
        </button>
      </div>
    </div>
  );
};

// 2. Podcast List (Explore)
const PodcastList: React.FC<{ 
    onOpen: (id: string) => void, 
    onProfile: (id: string) => void,
    currentUser: User,
    onRefreshUser: (u: User) => void
}> = ({ onOpen, onProfile, currentUser, onRefreshUser }) => {
  const [activeTab, setActiveTab] = useState<'PODCASTS' | 'PEOPLE'>('PODCASTS');
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setPodcasts(DB.getPodcasts());
    setUsers(DB.getAllUsers());
  }, []);

  const filteredPodcasts = podcasts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));
  
  // Filter users: Match name/nick, exclude self, exclude admin (optional)
  const filteredUsers = users.filter(u => 
    u.id !== currentUser.id && // Don't show myself
    u.role !== 'admin' && // Optional: Hide admin system user
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.nickname.toLowerCase().includes(search.toLowerCase()))
  );

  const handleQuickFollow = (targetId: string) => {
      const updated = DB.toggleFollow(currentUser.id, targetId);
      if (updated) {
          onRefreshUser(updated);
      }
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500">
      
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
        <input 
          type="text" 
          placeholder={activeTab === 'PODCASTS' ? "Search podcasts..." : "Search people..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
          <button 
            onClick={() => setActiveTab('PODCASTS')}
            className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'PODCASTS' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
              <Mic size={16} className="mr-2"/> Podcasts
          </button>
          <button 
            onClick={() => setActiveTab('PEOPLE')}
            className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'PEOPLE' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
              <Users size={16} className="mr-2"/> People
          </button>
      </div>

      <div className="space-y-4">
        
        {/* PODCASTS VIEW */}
        {activeTab === 'PODCASTS' && filteredPodcasts.map(pod => (
          <div key={pod.id} className="group bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 transition-all">
            <div onClick={() => onOpen(pod.id)} className="relative aspect-video cursor-pointer">
                <img src={pod.thumbnailUrl} alt={pod.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                        <Play fill="white" className="text-white" />
                    </div>
                </div>
            </div>
            <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                    <h3 onClick={() => onOpen(pod.id)} className="font-semibold text-lg line-clamp-1 cursor-pointer hover:text-indigo-400">{pod.title}</h3>
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{pod.category}</span>
                </div>
                <p className="text-zinc-400 text-sm line-clamp-2 mb-3">{pod.description}</p>
                <div className="flex items-center justify-between text-zinc-500 text-xs">
                    <div className="flex items-center space-x-3">
                         <button onClick={(e) => { e.stopPropagation(); onProfile(pod.authorId); }} className="hover:text-indigo-400 font-medium">
                            @{pod.authorName}
                         </button>
                    </div>
                    <span>{new Date(pod.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
          </div>
        ))}
        {activeTab === 'PODCASTS' && filteredPodcasts.length === 0 && (
            <div className="text-center py-10 text-zinc-500">No podcasts found.</div>
        )}

        {/* PEOPLE VIEW */}
        {activeTab === 'PEOPLE' && filteredUsers.map(user => {
            const isFollowing = currentUser.following?.includes(user.id);
            return (
                <div key={user.id} onClick={() => onProfile(user.id)} className="flex items-center justify-between bg-zinc-900 p-4 rounded-xl border border-zinc-800 cursor-pointer hover:bg-zinc-800/50">
                    <div className="flex items-center space-x-4">
                        <img src={user.photoUrl} alt={user.name} className="w-12 h-12 rounded-full bg-zinc-800 object-cover" />
                        <div>
                            <h4 className="font-bold text-white">{user.name}</h4>
                            <p className="text-xs text-zinc-500">{user.nickname}</p>
                            <div className="flex space-x-2 mt-1">
                                <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">{user.followers?.length || 0} followers</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleQuickFollow(user.id); }}
                        className={`p-2 rounded-full transition-all ${isFollowing ? 'bg-zinc-800 text-green-500' : 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white'}`}
                    >
                        {isFollowing ? <UserCheck size={20} /> : <UserPlus size={20} />}
                    </button>
                </div>
            );
        })}
        {activeTab === 'PEOPLE' && filteredUsers.length === 0 && (
            <div className="text-center py-10 text-zinc-500">No users found.</div>
        )}

      </div>
    </div>
  );
};

// 3. Podcast Detail
const PodcastDetail: React.FC<{ 
    id: string, 
    user: User, 
    onBack: () => void, 
    onRefreshUser: (u: User) => void,
    onProfile: (id: string) => void
}> = ({ id, user, onBack, onRefreshUser, onProfile }) => {
  const [podcast, setPodcast] = useState(DB.getPodcast(id));
  const [comments, setComments] = useState(DB.getComments(id));
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false); // Simplified: should check DB if already liked by user in real app
  const [isSaved, setIsSaved] = useState(user.savedPodcastIds.includes(id));
  const [isDownloaded, setIsDownloaded] = useState(user.downloadedPodcastIds.includes(id));

  if (!podcast) return <div>Not found</div>;

  const youtubeId = getYouTubeEmbedId(podcast.videoUrl);

  const handleLike = () => {
    setIsLiked(!isLiked);
    DB.toggleLike(user.id, podcast.id, !isLiked);
    setPodcast(prev => prev ? ({...prev, likesCount: prev.likesCount + (isLiked ? -1 : 1)}) : undefined);
  };

  const handleSave = () => {
    // Optimistic Update
    setIsSaved(!isSaved);
    // DB Call returns updated user immediately
    const updatedUser = DB.toggleSave(user.id, podcast.id);
    if (updatedUser) {
        onRefreshUser(updatedUser);
    }
  };
  
  const handleDownload = () => {
      setIsDownloaded(!isDownloaded);
      const updatedUser = DB.toggleDownload(user.id, podcast.id);
      if(updatedUser) onRefreshUser(updatedUser);
  };

  const postComment = () => {
    if (!newComment.trim()) return;
    const comment = {
        id: `c_${Date.now()}`,
        podcastId: podcast.id,
        authorId: user.id,
        authorName: user.name,
        text: newComment,
        createdAt: Date.now()
    };
    DB.addComment(comment);
    setComments([comment, ...comments]);
    setNewComment('');
  };

  return (
    <div className="animate-in slide-in-from-bottom-10 duration-300 bg-zinc-950 min-h-full pb-20">
      {/* Video Player Header */}
      <div className="sticky top-0 z-30 bg-black aspect-video relative">
        {youtubeId ? (
            <iframe 
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0`} 
                title={podcast.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
            />
        ) : (
            <video 
                src={podcast.videoUrl} 
                poster={podcast.thumbnailUrl}
                controls 
                className="w-full h-full object-contain bg-black"
            />
        )}
        
        <button 
            onClick={onBack} 
            className="absolute top-4 left-4 bg-black/50 p-2 rounded-full backdrop-blur-md text-white hover:bg-black/70 transition z-40"
        >
            <X size={20} />
        </button>
      </div>

      <div className="p-5 space-y-6">
        <div>
            <h1 className="text-2xl font-bold mb-2">{podcast.title}</h1>
            <div className="flex items-center justify-between mb-4">
                <div 
                    onClick={() => onProfile(podcast.authorId)}
                    className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition"
                >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">
                        {podcast.authorName[0]}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">{podcast.authorName}</p>
                        <p className="text-xs text-zinc-500">Host</p>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button onClick={handleDownload} className={`p-2 rounded-full ${isDownloaded ? 'bg-green-500/20 text-green-500' : 'bg-zinc-800 text-zinc-400'}`}>
                        {isDownloaded ? <CheckCircle size={20} /> : <Download size={20} />}
                    </button>
                    <button onClick={handleLike} className={`p-2 rounded-full ${isLiked ? 'bg-pink-500/20 text-pink-500' : 'bg-zinc-800 text-zinc-400'}`}>
                        <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                    </button>
                    <button onClick={handleSave} className={`p-2 rounded-full ${isSaved ? 'bg-indigo-500/20 text-indigo-500' : 'bg-zinc-800 text-zinc-400'}`}>
                        <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
                    </button>
                </div>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-300 mb-2">Description</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{podcast.description}</p>
            </div>
        </div>

        {/* Comments Section */}
        <div>
            <h3 className="font-semibold text-lg mb-4">Comments ({comments.length})</h3>
            <div className="flex items-center space-x-3 mb-6">
                <input 
                    type="text" 
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                />
                <button onClick={postComment} disabled={!newComment} className="p-2.5 bg-indigo-600 rounded-full disabled:opacity-50">
                    <Send size={18} />
                </button>
            </div>
            <div className="space-y-4">
                {comments.map(c => (
                    <div key={c.id} className="flex space-x-3">
                        <div onClick={() => onProfile(c.authorId)} className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center text-xs cursor-pointer">
                            {c.authorName[0]}
                        </div>
                        <div>
                            <div className="flex items-baseline space-x-2">
                                <span onClick={() => onProfile(c.authorId)} className="text-sm font-medium text-white cursor-pointer hover:underline">{c.authorName}</span>
                                <span className="text-xs text-zinc-600">{new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-zinc-400 text-sm mt-0.5">{c.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

// 4. Add Podcast
const AddPodcast: React.FC<{ user: User, onComplete: () => void }> = ({ user, onComplete }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Technology');
  const [videoUrl, setVideoUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // New States for Confirmation and Progress
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleGenerate = async () => {
    if (!title) return;
    setIsGenerating(true);
    const generated = await generatePodcastDescription(title, category);
    setDesc(generated);
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true); // Show confirmation dialog first
  };

  const handleConfirmAndUpload = () => {
      setShowConfirm(false);
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload process
      const interval = setInterval(() => {
          setUploadProgress(prev => {
              if (prev >= 100) {
                  clearInterval(interval);
                  return 100;
              }
              // Random increment
              return prev + Math.floor(Math.random() * 15) + 5;
          });
      }, 300);

      // Clean up and Save when 100% is reached
      // We use a separate check in useEffect or just time it here? 
      // Safer to check interval logic, but here we can just wait for logical completion
  };

  // Watch progress to trigger final save
  useEffect(() => {
      if (isUploading && uploadProgress >= 100) {
          // Delay slightly to show 100%
          const timer = setTimeout(() => {
              const newPod: Podcast = {
                id: `pod_${Date.now()}`,
                title,
                description: desc,
                category,
                videoUrl: videoUrl || 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                thumbnailUrl: `https://picsum.photos/seed/${Date.now()}/800/450`,
                authorId: user.id,
                authorName: user.name,
                likesCount: 0,
                commentsCount: 0,
                savedCount: 0,
                createdAt: Date.now()
              };
              DB.addPodcast(newPod);
              setIsUploading(false);
              onComplete();
          }, 800);
          return () => clearTimeout(timer);
      }
  }, [uploadProgress, isUploading]);

  return (
    <div className="p-6 animate-in fade-in zoom-in duration-300 relative">
        {/* Modal Overlay */}
        {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-full max-w-xs shadow-2xl animate-in zoom-in duration-200">
                    <h3 className="text-lg font-bold text-white mb-2">Confirm Upload</h3>
                    <p className="text-zinc-400 text-sm mb-6">Do you want to save this podcast?</p>
                    <div className="flex space-x-3">
                        <button 
                            onClick={() => setShowConfirm(false)}
                            className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleConfirmAndUpload}
                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition"
                        >
                            Yes, Save
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Uploading Overlay */}
        {isUploading && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 p-6">
                <UploadCloud size={48} className="text-indigo-500 mb-6 animate-bounce" />
                <h2 className="text-2xl font-bold text-white mb-2">Uploading...</h2>
                <p className="text-zinc-500 text-sm mb-8">Please wait while we process your content.</p>
                
                <div className="w-full max-w-xs bg-zinc-800 rounded-full h-4 overflow-hidden relative">
                    <div 
                        className="bg-indigo-600 h-full transition-all duration-300 ease-out"
                        style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                    />
                </div>
                <p className="text-indigo-400 font-bold mt-4">{Math.min(uploadProgress, 100)}%</p>
            </div>
        )}

        <h2 className="text-2xl font-bold mb-6">Upload Podcast</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500" />
            </div>
            
            <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500">
                    <option>Technology</option>
                    <option>Education</option>
                    <option>Entertainment</option>
                    <option>News</option>
                    <option>Relaxation</option>
                </select>
            </div>

            <div className="relative">
                <label className="block text-xs font-medium text-zinc-400 mb-1">Description</label>
                <textarea required rows={4} value={desc} onChange={e => setDesc(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500" />
                <button 
                    type="button" 
                    onClick={handleGenerate}
                    disabled={isGenerating || !title}
                    className="absolute right-2 bottom-2 text-xs bg-indigo-600/20 text-indigo-400 px-3 py-1 rounded-full flex items-center hover:bg-indigo-600/30 disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 size={12} className="animate-spin mr-1"/> : <Sparkles size={12} className="mr-1"/>}
                    {isGenerating ? 'Thinking...' : 'AI Generate'}
                </button>
            </div>

            <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center">
                    Video URL <Youtube size={14} className="ml-1 text-red-500" />
                </label>
                <input 
                    type="text" 
                    value={videoUrl} 
                    onChange={e => setVideoUrl(e.target.value)}
                    placeholder="Paste YouTube link or direct video URL..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-indigo-500" 
                />
                <p className="text-[10px] text-zinc-600 mt-1">Supports YouTube (e.g. youtube.com/watch?v=...) or .mp4 links.</p>
            </div>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg mt-4">
                Publish Podcast
            </button>
        </form>
    </div>
  );
};

// 5. Downloads Screen (Offline)
const Downloads: React.FC<{ user: User, onOpen: (id: string) => void }> = ({ user, onOpen }) => {
    const [downloaded, setDownloaded] = useState<Podcast[]>([]);

    useEffect(() => {
        const all = DB.getPodcasts();
        setDownloaded(all.filter(p => user.downloadedPodcastIds.includes(p.id)));
    }, [user]);

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-2">Downloads</h2>
            <p className="text-zinc-500 text-sm mb-6">Listen without an internet connection.</p>

            {downloaded.length === 0 ? (
                <div className="text-center py-10 bg-zinc-900 rounded-xl border border-zinc-800 border-dashed">
                    <Download className="mx-auto text-zinc-600 mb-2" size={32} />
                    <p className="text-zinc-500">No downloads yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {downloaded.map(pod => (
                        <div key={pod.id} onClick={() => onOpen(pod.id)} className="flex items-center space-x-4 bg-zinc-900 p-3 rounded-xl border border-zinc-800 cursor-pointer hover:bg-zinc-800/50">
                            <div className="relative w-20 h-20 flex-shrink-0">
                                <img src={pod.thumbnailUrl} className="w-full h-full object-cover rounded-lg" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                                    <Play size={16} fill="white" className="text-white"/>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white truncate">{pod.title}</h4>
                                <p className="text-xs text-zinc-500 mb-2">{pod.authorName}</p>
                                <div className="flex items-center text-green-500 text-xs">
                                    <CheckCircle size={12} className="mr-1" /> Downloaded
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// 6. Notifications Screen (With read/unread logic)
const Notifications: React.FC<{ user: User }> = ({ user }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        setNotifications(DB.getNotifications(user.id));
        // Auto mark as read when opening page (or implement per item click)
        return () => DB.markAllAsRead(user.id);
    }, [user.id]);

    const handleRead = (nId: string) => {
        DB.markAsRead(user.id, nId);
        setNotifications(prev => prev.map(n => n.id === nId ? { ...n, read: true } : n));
    };
    
    const getIcon = (type: Notification['type']) => {
        switch(type) {
            case 'follow': return <UserPlus size={16} className="text-indigo-400" />;
            case 'like': return <Heart size={16} className="text-pink-400" />;
            case 'comment': return <MessageSquare size={16} className="text-blue-400" />;
            case 'save': return <Bookmark size={16} className="text-emerald-400" />;
            default: return <BellRing size={16} className="text-zinc-400" />;
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Notifications</h2>
            <div className="space-y-4">
                {notifications.length === 0 && <p className="text-zinc-500">No notifications.</p>}
                {notifications.map(n => (
                    <div 
                        key={n.id} 
                        onClick={() => handleRead(n.id)}
                        className={`p-4 rounded-xl border transition-all ${n.read ? 'bg-zinc-900 border-zinc-800 opacity-60' : 'bg-indigo-900/20 border-indigo-500/30 cursor-pointer'}`}
                    >
                        <div className="flex items-start space-x-3">
                            <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-zinc-800`}>
                                {getIcon(n.type)}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">{n.title}</h4>
                                <p className="text-zinc-400 text-sm">{n.message}</p>
                                <p className="text-zinc-600 text-xs mt-2">{new Date(n.date).toLocaleTimeString()}</p>
                            </div>
                             {!n.read && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2"></div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 7. Public & Private Profile
const Profile: React.FC<{ 
    viewedUserId: string, 
    currentUser: User, 
    onRefreshUser: (u: User) => void,
    onOpenPodcast: (id: string) => void
}> = ({ viewedUserId, currentUser, onRefreshUser, onOpenPodcast }) => {
  const [profileUser, setProfileUser] = useState<User | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'PUBLISHED' | 'SAVED'>('PUBLISHED');
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  
  // Logic
  const isOwnProfile = viewedUserId === currentUser.id;
  const isFollowing = currentUser.following?.includes(viewedUserId);

  useEffect(() => {
    // Load the profile user data
    const u = DB.getUser(viewedUserId);
    setProfileUser(u);

    // Initial Load of Podcasts (Published by default)
    if (u) {
        setPodcasts(DB.getUserPodcasts(u.id));
    }
  }, [viewedUserId, currentUser]); // currentUser dep ensures stats update if I follow

  useEffect(() => {
      // Switch content based on tab
      if (!profileUser) return;

      if (activeTab === 'PUBLISHED') {
          setPodcasts(DB.getUserPodcasts(profileUser.id));
      } else {
          // Saved Podcasts (Only relevant for Own Profile mostly, but logic supports viewing if we wanted)
          // For strict privacy, maybe only show Saved if isOwnProfile.
          const all = DB.getPodcasts();
          setPodcasts(all.filter(p => profileUser.savedPodcastIds.includes(p.id)));
      }
  }, [activeTab, profileUser, currentUser]);

  const handleFollow = () => {
      const updated = DB.toggleFollow(currentUser.id, viewedUserId);
      if (updated) {
          onRefreshUser(updated); // Refresh *my* state (following count)
          // Also need to refresh *profileUser* state (follower count) locally
          const updatedProfileUser = DB.getUser(viewedUserId);
          setProfileUser(updatedProfileUser);
      }
  };

  if (!profileUser) return <div className="p-10 text-center">User not found</div>;

  return (
    <div className="p-6">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
            <img src={profileUser.photoUrl} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-zinc-800 mb-4" />
            <h2 className="text-2xl font-bold">{profileUser.name}</h2>
            <p className="text-indigo-400 text-sm">{profileUser.nickname}</p>
            <p className="text-zinc-500 text-sm mt-2 text-center max-w-xs">{profileUser.description || "No bio yet."}</p>
            
            {!isOwnProfile && (
                <button 
                    onClick={handleFollow}
                    className={`mt-4 px-6 py-2 rounded-full font-medium text-sm flex items-center transition-all ${isFollowing ? 'bg-zinc-800 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                    {isFollowing ? <><UserCheck size={16} className="mr-2"/> Following</> : <><UserPlus size={16} className="mr-2"/> Follow</>}
                </button>
            )}
        </div>

        {/* Stats */}
        <div className="bg-zinc-900 rounded-xl p-1 mb-6">
            <div className="grid grid-cols-3 text-center divide-x divide-zinc-800">
                <div className="p-3">
                    <span className="block text-xl font-bold text-white">{DB.getUserPodcasts(profileUser.id).length}</span>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Podcasts</span>
                </div>
                <div className="p-3">
                    <span className="block text-xl font-bold text-white">{profileUser.followers?.length || 0}</span>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Followers</span>
                </div>
                <div className="p-3">
                    <span className="block text-xl font-bold text-white">{profileUser.following?.length || 0}</span>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Following</span>
                </div>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 mb-4">
            <button 
                onClick={() => setActiveTab('PUBLISHED')}
                className={`flex-1 pb-3 text-sm font-medium ${activeTab === 'PUBLISHED' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-zinc-500'}`}
            >
                Published
            </button>
            {isOwnProfile && (
                <button 
                    onClick={() => setActiveTab('SAVED')}
                    className={`flex-1 pb-3 text-sm font-medium ${activeTab === 'SAVED' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-zinc-500'}`}
                >
                    Saved
                </button>
            )}
        </div>

        {/* List */}
        <div className="space-y-3">
            {podcasts.length === 0 && <p className="text-zinc-600 text-sm text-center py-4">Nothing here yet.</p>}
            {podcasts.map(p => (
                <div key={p.id} onClick={() => onOpenPodcast(p.id)} className="flex items-center space-x-4 bg-zinc-900 p-3 rounded-lg border border-zinc-800 cursor-pointer hover:bg-zinc-800/80">
                    <img src={p.thumbnailUrl} className="w-12 h-12 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{p.title}</h4>
                        <p className="text-xs text-zinc-500 truncate">{new Date(p.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

// 8. Admin Panel
const AdminPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'CONTENT' | 'USERS'>('USERS');
    const [users, setUsers] = useState<User[]>(DB.getAllUsers());
    const [podcasts, setPodcasts] = useState<Podcast[]>(DB.getPodcasts());

    const handleDeletePodcast = (id: string) => {
        if(confirm('Delete this podcast?')) {
            DB.deletePodcast(id);
            setPodcasts(DB.getPodcasts());
        }
    };

    const handleDeleteUser = (id: string) => {
        if (id === 'admin_1') {
            alert("Cannot delete root admin.");
            return;
        }
        if(confirm('Delete this user?')) {
            DB.deleteUser(id);
            setUsers(DB.getAllUsers());
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
                 <Shield className="text-red-500" size={28} />
                 <div>
                    <h2 className="text-2xl font-bold text-white">Admin Control</h2>
                    <p className="text-zinc-500 text-xs">Superuser Access</p>
                 </div>
            </div>

            <div className="flex mb-6 bg-zinc-900 rounded-lg p-1">
                <button 
                    onClick={() => setActiveTab('USERS')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'USERS' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Users
                </button>
                <button 
                    onClick={() => setActiveTab('CONTENT')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'CONTENT' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Content
                </button>
            </div>

            {activeTab === 'USERS' && (
                 <div className="space-y-3">
                     <p className="text-zinc-500 text-sm mb-2">Registered Users ({users.length})</p>
                     {users.map(u => (
                         <div key={u.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                             <div className="flex items-center space-x-3">
                                 <img src={u.photoUrl} className="w-10 h-10 rounded-full bg-zinc-800" />
                                 <div>
                                     <p className="font-bold text-sm text-white">{u.name} <span className="text-zinc-500 font-normal">({u.role})</span></p>
                                     <p className="text-xs text-zinc-500">{u.email}</p>
                                 </div>
                             </div>
                             {u.role !== 'admin' && (
                                <button onClick={() => handleDeleteUser(u.id)} className="p-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500 hover:text-white transition">
                                    <UserX size={16} />
                                </button>
                             )}
                         </div>
                     ))}
                 </div>
            )}

            {activeTab === 'CONTENT' && (
                <div className="space-y-4">
                     <p className="text-zinc-500 text-sm mb-2">All Podcasts ({podcasts.length})</p>
                    {podcasts.map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                            <div>
                                <p className="font-bold text-sm text-white line-clamp-1">{p.title}</p>
                                <p className="text-xs text-zinc-500">ID: {p.id}</p>
                            </div>
                            <button onClick={() => handleDeletePodcast(p.id)} className="p-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500 hover:text-white transition">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Main App Component ---
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>({ type: 'LOGIN' });

  // Init auth check
  useEffect(() => {
    const currentUser = DB.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setView({ type: 'PODCAST_LIST' });
    }
  }, []);

  const handleLoginSuccess = (u: User) => {
    setUser(u);
    setView({ type: 'PODCAST_LIST' });
  };

  const handleLogout = () => {
    DB.logout();
    setUser(null);
    setView({ type: 'LOGIN' });
  };
  
  const refreshUser = (u: User) => {
      // Force update user state from DB to ensure sync
      const freshUser = DB.getUser(u.id);
      if(freshUser) setUser(freshUser);
  };

  // Rendering logic based on state
  const renderContent = () => {
    if (!user) {
        if (view.type === 'REGISTER') 
            return <AuthScreen mode="REGISTER" onSwitch={() => setView({type: 'LOGIN'})} onSuccess={handleLoginSuccess} />;
        return <AuthScreen mode="LOGIN" onSwitch={() => setView({type: 'REGISTER'})} onSuccess={handleLoginSuccess} />;
    }

    switch (view.type) {
      case 'PODCAST_LIST':
        return <PodcastList 
            onOpen={(id) => setView({ type: 'PODCAST_DETAIL', podcastId: id })} 
            onProfile={(id) => setView({ type: 'PROFILE', userId: id })}
            currentUser={user}
            onRefreshUser={refreshUser}
        />;
      case 'PODCAST_DETAIL':
        return <PodcastDetail 
            key={view.podcastId} 
            id={view.podcastId} 
            user={user} 
            onBack={() => setView({ type: 'PODCAST_LIST' })} 
            onRefreshUser={refreshUser}
            onProfile={(id) => setView({ type: 'PROFILE', userId: id })}
        />;
      case 'ADD_PODCAST':
        // Redirect to Profile upon completion to see the new podcast immediately
        return <AddPodcast user={user} onComplete={() => setView({ type: 'PROFILE', userId: user.id })} />;
      case 'DOWNLOADS':
        return <Downloads user={user} onOpen={(id) => setView({ type: 'PODCAST_DETAIL', podcastId: id })} />;
      case 'NOTIFICATIONS':
        return <Notifications user={user} />;
      case 'PROFILE':
        return <Profile 
            key={view.userId} // Force refresh if switching between profiles
            viewedUserId={view.userId} 
            currentUser={user} 
            onRefreshUser={refreshUser}
            onOpenPodcast={(id) => setView({ type: 'PODCAST_DETAIL', podcastId: id })} 
        />;
      case 'ADMIN_PANEL':
        return user.role === 'admin' ? <AdminPanel /> : <div className="p-6 text-center text-red-500">Access Denied</div>;
      default:
        return <PodcastList 
            onOpen={(id) => setView({ type: 'PODCAST_DETAIL', podcastId: id })} 
            onProfile={(id) => setView({ type: 'PROFILE', userId: id })} 
            currentUser={user}
            onRefreshUser={refreshUser}
        />;
    }
  };

  return (
    <Layout 
      user={user} 
      currentView={view} 
      onNavigate={setView} 
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;