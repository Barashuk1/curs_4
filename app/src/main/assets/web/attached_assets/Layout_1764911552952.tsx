import React from 'react';
import { User, ViewState } from '../types';
import { Home, PlusCircle, User as UserIcon, LogOut, ShieldAlert, Download, Bell } from 'lucide-react';
import { DB } from '../services/db';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, currentView, onNavigate, onLogout }) => {
  if (!user) {
    return <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">{children}</div>;
  }

  const unreadCount = DB.getUnreadCount(user.id);

  const NavItem = ({ icon: Icon, label, active, onClick, badge }: any) => (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center space-y-1 w-full p-2 transition-colors ${
        active ? 'text-indigo-500' : 'text-zinc-600 hover:text-zinc-400'
      }`}
    >
      <div className="relative">
        <Icon size={22} />
        {badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-zinc-900">
                {badge > 9 ? '9+' : badge}
            </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="h-[100dvh] bg-zinc-950 text-white flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden border-x border-zinc-800 relative">
      {/* Top Bar - Fixed */}
      <header className="bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 p-4 sticky top-0 z-50 flex justify-between items-center shadow-md shrink-0">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent cursor-pointer" onClick={() => onNavigate({ type: 'PODCAST_LIST'})}>
          Podcast Pro
        </h1>
        <div className="flex items-center space-x-2">
            {user.role === 'admin' && (
                <button 
                    onClick={() => onNavigate({ type: 'ADMIN_PANEL' })}
                    className="p-2 text-red-400 hover:bg-zinc-800 rounded-full"
                    title="Admin Panel"
                >
                    <ShieldAlert size={20} />
                </button>
            )}
            <button onClick={onLogout} className="p-2 text-zinc-400 hover:text-white" title="Logout">
                <LogOut size={20} />
            </button>
        </div>
      </header>

      {/* Main Content - Scrollable Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar bg-zinc-950 relative scroll-smooth">
        {children}
      </main>

      {/* Bottom Navigation - Fixed */}
      <nav className="bg-zinc-900 border-t border-zinc-800 sticky bottom-0 z-40 w-full shrink-0">
        <div className="grid grid-cols-5 h-16">
          <NavItem
            icon={Home}
            label="Feed"
            active={currentView.type === 'PODCAST_LIST' || currentView.type === 'PODCAST_DETAIL'}
            onClick={() => onNavigate({ type: 'PODCAST_LIST' })}
          />
          <NavItem
            icon={Download}
            label="Downloads"
            active={currentView.type === 'DOWNLOADS'}
            onClick={() => onNavigate({ type: 'DOWNLOADS' })}
          />
          <NavItem
            icon={PlusCircle}
            label="Create"
            active={currentView.type === 'ADD_PODCAST'}
            onClick={() => onNavigate({ type: 'ADD_PODCAST' })}
          />
          <NavItem
             icon={Bell}
             label="Alerts"
             active={currentView.type === 'NOTIFICATIONS'}
             onClick={() => onNavigate({ type: 'NOTIFICATIONS' })}
             badge={unreadCount}
           />
          <NavItem
            icon={UserIcon}
            label="Profile"
            active={currentView.type === 'PROFILE'}
            onClick={() => onNavigate({ type: 'PROFILE', userId: user.id })}
          />
        </div>
      </nav>
    </div>
  );
};