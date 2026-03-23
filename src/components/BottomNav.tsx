import { Home, Search, Music2, User } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'home' | 'search' | 'playlist' | 'profile';
  onTabChange: (tab: 'home' | 'search' | 'playlist' | 'profile') => void;
}

const navItems = [
  { id: 'home' as const, label: '首页', icon: Home },
  { id: 'search' as const, label: '搜索', icon: Search },
  { id: 'playlist' as const, label: '歌单', icon: Music2 },
  { id: 'profile' as const, label: '我的', icon: User }
];

export function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-xl border-t border-gray-100 flex items-center justify-around px-2 z-40">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        
        return (
          <button
            key={item.id}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-xl transition-all duration-200 ${
              isActive 
                ? 'text-red-600' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => onTabChange(item.id)}
          >
            <Icon 
              className={`w-5 h-5 transition-transform duration-200 ${
                isActive ? 'scale-110 -translate-y-0.5' : ''
              }`} 
            />
            <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
