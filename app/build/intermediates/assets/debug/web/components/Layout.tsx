import React from 'react';
import { User, ViewState } from '../types';
import { Home, PlusCircle, User as UserIcon, LogOut, ShieldAlert, Download, Bell } from 'lucide-react';

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

  const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center space-y-1 w-full p-2 transition-colors ${
        active ? 'text-indigo-500' : 'text-zinc-600 hover:text-zinc-400'
      }`}
    >
      <Icon size={22} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden border-x border-zinc-800">
      {/* Top Bar */}
      <header className="bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 p-4 sticky top-0 z-20 flex justify-between items-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-zinc-900 border-t border-zinc-800 pb-safe sticky bottom-0 z-20">
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