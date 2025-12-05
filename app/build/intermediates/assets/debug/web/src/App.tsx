import React, { useState, useEffect } from 'react';
import { ViewState, User, Podcast, Notification, Comment } from './types';
import { DB } from './services/db';
import { Layout } from './components/Layout';
import { generatePodcastDescription } from './services/geminiService';
import { 
  Play, Heart, MessageSquare, Bookmark, Share2, 
  Search, Trash2, Video, Send, Loader2, Sparkles, X,
  Download, CheckCircle, Shield, UserX, BellRing, Users,
  UserPlus, UserCheck, Mic, UploadCloud
} from 'lucide-react';

const getVimeoEmbedId = (url: string) => {
    if (!url) return null;

    // Handle Vimeo URLs - more flexible regex
    const vimeoRegExp = /vimeo\.com\/(?:manage\/videos\/)?(\d+)/;
    const vimeoMatch = url.match(vimeoRegExp);

    return vimeoMatch ? vimeoMatch[1] : null;
};
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
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Password is required');
      return;
    }

    if (isAdminLogin) {
        const adminUser = DB.login('admin', password);
        if (adminUser) onSuccess(adminUser);
        else setError('Invalid Admin credentials');
        return;
    }

    if (mode === 'LOGIN') {
      const user = DB.login(email, password);
      if (user) onSuccess(user);
      else setError('Invalid email or password');
    } else {
      if (!name || !nickname || !email) {
          setError('All fields are required');
          return;
      }
      const result = DB.register(name, email, nickname, password);
      if ('error' in result) {
        setError(result.error);
      } else {
        onSuccess(result);
      }
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
  const filteredUsers = users.filter(u => 
    u.id !== currentUser.id &&
    u.role !== 'admin' &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.nickname.toLowerCase().includes(search.toLowerCase()))
  );

  const handleQuickFollow = (targetId: string) => {
      const updated = DB.toggleFollow(currentUser.id, targetId);
      if (updated) {
          onRefreshUser(updated);
          setUsers(DB.getAllUsers());
      }
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500">
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
                    <button onClick={(e) => { e.stopPropagation(); onProfile(pod.authorId); }} className="hover:text-indigo-400 font-medium">
                        @{pod.authorName}
                    </button>
                    <span>{new Date(pod.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
          </div>
        ))}
        {activeTab === 'PODCASTS' && filteredPodcasts.length === 0 && (
            <div className="text-center py-10 text-zinc-500">No podcasts found.</div>
        )}

        {activeTab === 'PEOPLE' && filteredUsers.map(user => {
            const isFollowing = currentUser.following?.includes(user.id);
            return (
                <div key={user.id} onClick={() => onProfile(user.id)} className="flex items-center justify-between bg-zinc-900 p-4 rounded-xl border border-zinc-800 cursor-pointer hover:bg-zinc-800/50">
                    <div className="flex items-center space-x-4">
                        <img src={user.photoUrl} alt={user.name} className="w-12 h-12 rounded-full bg-zinc-800 object-cover" />
                        <div>
                            <h4 className="font-bold text-white">{user.name}</h4>
                            <p className="text-xs text-zinc-500">{user.nickname}</p>
                            <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">{user.followers?.length || 0} followers</span>
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
  const [isLiked, setIsLiked] = useState(DB.isLikedByUser(user.id, id));
  //const [isSaved, setIsSaved] = useState(user.savedPodcastIds?.includes(id) || false);
  const [isDownloaded, setIsDownloaded] = useState(user.downloadedPodcastIds?.includes(id) || false);

  if (!podcast) return <div className="p-4 text-center">Not found</div>;

  const vimeoId = getVimeoEmbedId(podcast.videoUrl);

  const handleLike = () => {
    const updatedUser = DB.toggleLike(user.id, podcast.id);
    if (updatedUser) {
      onRefreshUser(updatedUser);
      const wasLiked = isLiked;
      setIsLiked(!wasLiked);
      setPodcast(prev => prev ? ({...prev, likesCount: prev.likesCount + (wasLiked ? -1 : 1)}) : undefined);
    }
  };

  //const handleSave = () => {
    //const updatedUser = DB.toggleSave(user.id, podcast.id);
    //if (updatedUser) {
      //onRefreshUser(updatedUser);
      //setIsSaved(!isSaved);
    //}
  //};
  
  const handleDownload = () => {
      const updatedUser = DB.toggleDownload(user.id, podcast.id);
      if(updatedUser) {
        onRefreshUser(updatedUser);
        setIsDownloaded(!isDownloaded);
      }
  };

  const postComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
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
      <div className="sticky top-0 z-30 bg-black aspect-video relative">
        {vimeoId ? (
            <iframe
                src={`https://player.vimeo.com/video/${vimeoId}?autoplay=0&title=0&byline=0&portrait=0&badge=0`}
                title={podcast.title}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
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
                <div onClick={() => onProfile(podcast.authorId)} className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition">
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

                </div>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-300 mb-2">Description</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{podcast.description}</p>
            </div>
        </div>

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

const AddPodcast: React.FC<{ user: User, onComplete: () => void }> = ({ user, onComplete }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Technology');
  const [videoUrl, setVideoUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const categories = ['Technology', 'Entertainment', 'Education', 'News', 'Sports', 'Music', 'Comedy', 'Relaxation', 'Business', 'Science'];

  const handleGenerate = async () => {
    if (!title) return;
    setIsGenerating(true);
    const generated = await generatePodcastDescription(title, category);
    setDesc(generated);
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmAndUpload = () => {
      setShowConfirm(false);
      setIsUploading(true);
      setUploadProgress(0);

      const interval = setInterval(() => {
          setUploadProgress(prev => {
              if (prev >= 100) {
                  clearInterval(interval);
                  return 100;
              }
              return prev + Math.floor(Math.random() * 15) + 5;
          });
      }, 300);
  };

  useEffect(() => {
      if (isUploading && uploadProgress >= 100) {
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
        {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-full max-w-xs shadow-2xl animate-in zoom-in duration-200">
                    <h3 className="text-lg font-bold text-white mb-2">Confirm Upload</h3>
                    <p className="text-zinc-400 text-sm mb-6">Do you want to save this podcast?</p>
                    <div className="flex space-x-3">
                        <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition">Cancel</button>
                        <button onClick={handleConfirmAndUpload} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition">Yes, Save</button>
                    </div>
                </div>
            </div>
        )}

        {isUploading && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 p-6">
                <UploadCloud size={48} className="text-indigo-500 mb-6 animate-bounce" />
                <h2 className="text-2xl font-bold mb-2">Uploading...</h2>
                <p className="text-zinc-400 mb-6">{Math.min(uploadProgress, 100)}%</p>
                <div className="w-48 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(uploadProgress, 100)}%` }} />
                </div>
            </div>
        )}

        <h2 className="text-2xl font-bold mb-6">Create Podcast</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Title</label>
                <input type="text" placeholder="Enter podcast title" value={title} onChange={e => setTitle(e.target.value)} required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-zinc-300">Description</label>
                    <button type="button" onClick={handleGenerate} disabled={isGenerating || !title}
                        className="flex items-center space-x-1 text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50">
                        {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        <span>{isGenerating ? 'Generating...' : 'AI Generate'}</span>
                    </button>
                </div>
                <textarea placeholder="Describe your podcast..." value={desc} onChange={e => setDesc(e.target.value)} required rows={4}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 resize-none" />
            </div>

           <div>
               <label className="block text-sm font-medium text-zinc-300 mb-2">Video URL (Vimeo or direct link)</label>
               <div className="relative">
                   {/* Change the icon from Youtube to Video */}
                   <Video className="absolute left-3 top-3.5 text-zinc-500" size={18} />
                   <input
                       type="url"
                       placeholder="https://vimeo.com/..."
                       value={videoUrl}
                       onChange={e => setVideoUrl(e.target.value)}
                       className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                   />
               </div>
           </div>

            <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all active:scale-98 shadow-lg shadow-indigo-500/20">
                🚀 Publish Podcast
            </button>
        </form>
    </div>
  );
};

const DownloadsView: React.FC<{ user: User, onOpen: (id: string) => void, onRefreshUser: (u: User) => void }> = ({ user, onOpen, onRefreshUser }) => {
  const downloadedPodcasts = user.downloadedPodcastIds.map(id => DB.getPodcast(id)).filter(Boolean) as Podcast[];

  const handleRemove = (podcastId: string) => {
      const updated = DB.toggleDownload(user.id, podcastId);
      if (updated) onRefreshUser(updated);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Downloads</h2>
      {downloadedPodcasts.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <Download size={48} className="mx-auto mb-4 opacity-50" />
          <p>No downloaded podcasts yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {downloadedPodcasts.map(pod => (
            <div key={pod.id} className="flex items-center space-x-3 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
              <img src={pod.thumbnailUrl} alt={pod.title} className="w-20 h-14 object-cover rounded-lg cursor-pointer" onClick={() => onOpen(pod.id)} />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate cursor-pointer hover:text-indigo-400" onClick={() => onOpen(pod.id)}>{pod.title}</h3>
                <p className="text-xs text-zinc-500">{pod.category}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full flex items-center"><CheckCircle size={12} className="mr-1" />Saved</span>
                <button onClick={() => handleRemove(pod.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const NotificationsView: React.FC<{ user: User, onPodcast: (id: string) => void, onProfile: (id: string) => void }> = ({ user, onPodcast, onProfile }) => {
  const [notifications, setNotifications] = useState(DB.getNotifications(user.id));

  const handleMarkAllRead = () => {
    DB.markAllAsRead(user.id);
    setNotifications(DB.getNotifications(user.id));
  };

  const handleClick = (n: Notification) => {
    if (!n.read) {
      DB.markAsRead(user.id, n.id);
      setNotifications(DB.getNotifications(user.id));
    }
    if (n.relatedId) {
      if (n.type === 'follow') onProfile(n.relatedId);
      else onPodcast(n.relatedId);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={20} className="text-pink-500" />;
      case 'comment': return <MessageSquare size={20} className="text-blue-500" />;
      case 'follow': return <UserPlus size={20} className="text-green-500" />;
      case 'save': return <Bookmark size={20} className="text-indigo-500" />;
      default: return <BellRing size={20} className="text-zinc-400" />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Notifications</h2>
        {notifications.some(n => !n.read) && (
          <button onClick={handleMarkAllRead} className="text-xs text-indigo-400 hover:underline">Mark all read</button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <BellRing size={48} className="mx-auto mb-4 opacity-50" />
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} onClick={() => handleClick(n)}
                className={`flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition ${n.read ? 'bg-zinc-900 border-zinc-800' : 'bg-indigo-500/10 border-indigo-500/30'}`}>
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">{getIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-sm">{n.title}</h4>
                  {!n.read && <div className="w-2 h-2 bg-indigo-500 rounded-full" />}
                </div>
                <p className="text-zinc-400 text-sm mt-0.5">{n.message}</p>
                <p className="text-zinc-600 text-xs mt-1">{new Date(n.date).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProfileView: React.FC<{ userId: string, currentUser: User, onRefreshUser: (u: User) => void, onOpenPodcast: (id: string) => void }> = ({ userId, currentUser, onRefreshUser, onOpenPodcast }) => {
  const profileUser = DB.getUser(userId);
  const userPodcasts = DB.getUserPodcasts(userId);
  const isOwnProfile = userId === currentUser.id;
  const [isFollowing, setIsFollowing] = useState(currentUser.following?.includes(userId) || false);

  if (!profileUser) return <div className="p-6 text-center text-zinc-500">User not found</div>;

  const handleFollow = () => {
    const updated = DB.toggleFollow(currentUser.id, userId);
    if (updated) {
      setIsFollowing(!isFollowing);
      onRefreshUser(updated);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col items-center mb-8">
        <img src={profileUser.photoUrl} alt={profileUser.name} className="w-24 h-24 rounded-full bg-zinc-800 object-cover mb-4 border-4 border-indigo-500/30" />
        <h2 className="text-2xl font-bold">{profileUser.name}</h2>
        <p className="text-zinc-500">{profileUser.nickname}</p>
        {profileUser.description && <p className="text-zinc-400 text-sm text-center mt-2 max-w-xs">{profileUser.description}</p>}
        
        <div className="flex space-x-8 mt-4">
          <div className="text-center">
            <p className="text-xl font-bold">{profileUser.followers?.length || 0}</p>
            <p className="text-xs text-zinc-500">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{profileUser.following?.length || 0}</p>
            <p className="text-xs text-zinc-500">Following</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{userPodcasts.length}</p>
            <p className="text-xs text-zinc-500">Podcasts</p>
          </div>
        </div>

        {!isOwnProfile && (
          <button onClick={handleFollow}
            className={`mt-6 px-8 py-2.5 rounded-full font-semibold transition ${isFollowing ? 'bg-zinc-800 text-green-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
            {isFollowing ? <><UserCheck size={18} className="inline mr-2" />Following</> : <><UserPlus size={18} className="inline mr-2" />Follow</>}
          </button>
        )}
      </div>

      <h3 className="font-semibold text-lg mb-4">Podcasts</h3>
      {userPodcasts.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">No podcasts yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {userPodcasts.map(pod => (
            <div key={pod.id} onClick={() => onOpenPodcast(pod.id)} className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 cursor-pointer hover:border-indigo-500 transition">
              <img src={pod.thumbnailUrl} alt={pod.title} className="w-full aspect-video object-cover" />
              <div className="p-3">
                <h4 className="font-semibold text-sm truncate">{pod.title}</h4>
                <div className="flex items-center space-x-2 text-xs text-zinc-500 mt-1">
                  <span className="flex items-center"><Heart size={12} className="mr-1" />{pod.likesCount}</span>
                  <span className="flex items-center"><MessageSquare size={12} className="mr-1" />{pod.commentsCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminPanel: React.FC<{ onPodcast: (id: string) => void }> = ({ onPodcast }) => {
  const [tab, setTab] = useState<'PODCASTS' | 'USERS'>('PODCASTS');
  const [podcasts, setPodcasts] = useState(DB.getPodcasts());
  const [users, setUsers] = useState(DB.getAllUsers());

  const handleDeletePodcast = (id: string) => {
    DB.deletePodcast(id);
    setPodcasts(DB.getPodcasts());
  };

  const handleDeleteUser = (id: string) => {
    DB.deleteUser(id);
    setUsers(DB.getAllUsers());
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="text-red-500" size={32} />
        <div>
          <h2 className="text-2xl font-bold text-red-400">Admin Panel</h2>
          <p className="text-xs text-zinc-500">Manage content and users</p>
        </div>
      </div>

      <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 mb-6">
        <button onClick={() => setTab('PODCASTS')} className={`flex-1 py-2 text-sm font-medium rounded-md ${tab === 'PODCASTS' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>
          🎙️ Podcasts ({podcasts.length})
        </button>
        <button onClick={() => setTab('USERS')} className={`flex-1 py-2 text-sm font-medium rounded-md ${tab === 'USERS' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>
          👥 Users ({users.filter(u => u.role !== 'admin').length})
        </button>
      </div>

      {tab === 'PODCASTS' && (
        <div className="space-y-3">
          {podcasts.map(pod => (
            <div key={pod.id} className="flex items-center space-x-3 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
              <img src={pod.thumbnailUrl} alt={pod.title} className="w-16 h-12 object-cover rounded-lg cursor-pointer" onClick={() => onPodcast(pod.id)} />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{pod.title}</h4>
                <p className="text-xs text-zinc-500">by {pod.authorName}</p>
              </div>
              <button onClick={() => handleDeletePodcast(pod.id)} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20 flex items-center">
                <Trash2 size={14} className="mr-1" /> Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'USERS' && (
        <div className="space-y-3">
          {users.filter(u => u.role !== 'admin').map(user => (
            <div key={user.id} className="flex items-center space-x-3 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
              <img src={user.photoUrl} alt={user.name} className="w-11 h-11 rounded-full bg-zinc-800 object-cover" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{user.name}</h4>
                <p className="text-xs text-zinc-500">{user.nickname} • {user.followers?.length || 0} followers</p>
              </div>
              <button onClick={() => handleDeleteUser(user.id)} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20 flex items-center">
                <UserX size={14} className="mr-1" /> Ban
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>({ type: 'LOGIN' });

  useEffect(() => {
    const user = DB.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setCurrentView({ type: 'PODCAST_LIST' });
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView({ type: 'PODCAST_LIST' });
  };

  const handleLogout = () => {
    DB.logout();
    setCurrentUser(null);
    setCurrentView({ type: 'LOGIN' });
  };

  const handleRefreshUser = (user: User) => {
    setCurrentUser(user);
  };

  const renderContent = () => {
    switch (currentView.type) {
      case 'LOGIN':
        return <AuthScreen mode="LOGIN" onSwitch={() => setCurrentView({ type: 'REGISTER' })} onSuccess={handleLogin} />;
      case 'REGISTER':
        return <AuthScreen mode="REGISTER" onSwitch={() => setCurrentView({ type: 'LOGIN' })} onSuccess={handleLogin} />;
      case 'PODCAST_LIST':
        return currentUser && <PodcastList onOpen={id => setCurrentView({ type: 'PODCAST_DETAIL', podcastId: id })} onProfile={id => setCurrentView({ type: 'PROFILE', userId: id })} currentUser={currentUser} onRefreshUser={handleRefreshUser} />;
      case 'PODCAST_DETAIL':
        return currentUser && <PodcastDetail id={currentView.podcastId} user={currentUser} onBack={() => setCurrentView({ type: 'PODCAST_LIST' })} onRefreshUser={handleRefreshUser} onProfile={id => setCurrentView({ type: 'PROFILE', userId: id })} />;
      case 'ADD_PODCAST':
        return currentUser && <AddPodcast user={currentUser} onComplete={() => setCurrentView({ type: 'PODCAST_LIST' })} />;
      case 'DOWNLOADS':
        return currentUser && <DownloadsView user={currentUser} onOpen={id => setCurrentView({ type: 'PODCAST_DETAIL', podcastId: id })} onRefreshUser={handleRefreshUser} />;
      case 'NOTIFICATIONS':
        return currentUser && <NotificationsView user={currentUser} onPodcast={id => setCurrentView({ type: 'PODCAST_DETAIL', podcastId: id })} onProfile={id => setCurrentView({ type: 'PROFILE', userId: id })} />;
      case 'PROFILE':
        return currentUser && <ProfileView userId={currentView.userId} currentUser={currentUser} onRefreshUser={handleRefreshUser} onOpenPodcast={id => setCurrentView({ type: 'PODCAST_DETAIL', podcastId: id })} />;
      case 'ADMIN_PANEL':
        return <AdminPanel onPodcast={id => setCurrentView({ type: 'PODCAST_DETAIL', podcastId: id })} />;
      default:
        return null;
    }
  };

  return (
    <Layout user={currentUser} currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
}
