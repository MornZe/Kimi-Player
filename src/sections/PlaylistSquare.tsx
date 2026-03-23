import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import * as api from '@/services/api';
import type { Playlist } from '@/types/music';

interface PlaylistSquareProps {
  onPlaylistClick: (id: number) => void;
}

export function PlaylistSquare({ onPlaylistClick }: PlaylistSquareProps) {
  const [highqualityPlaylists, setHighqualityPlaylists] = useState<Playlist[]>([]);
  const [playlistCategories, setPlaylistCategories] = useState<{ name: string }[]>([]);
  const [topPlaylists, setTopPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [hqRes, catRes, topRes] = await Promise.all([
          api.fetchRecommendPlaylists(9),
          api.fetchPlaylistCategories(),
          api.fetchTopPlaylists(9)
        ]);
        
        setHighqualityPlaylists(hqRes);
        setPlaylistCategories(catRes);
        setTopPlaylists(topRes);
        setLoading(false);
      } catch (error) {
        console.error('加载歌单数据失败:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-gradient-to-b from-white to-gray-50">
        <h1 className="text-2xl font-bold text-gray-900">歌单广场</h1>
      </div>

      {/* 精品歌单 */}
      <SectionHeader title="精品歌单" />
      
      <div className="px-4 grid grid-cols-3 gap-3 mb-6">
        {loading ? (
          Array(9).fill(0).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="w-full aspect-square rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))
        ) : (
          highqualityPlaylists.map(playlist => (
            <PlaylistCard 
              key={playlist.id}
              playlist={playlist}
              onClick={() => onPlaylistClick(playlist.id)}
            />
          ))
        )}
      </div>

      {/* 热门分类 */}
      <SectionHeader title="热门分类" />
      
      <div className="px-4 flex flex-wrap gap-2.5 mb-6">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-9 w-16 rounded-full" />
          ))
        ) : (
          playlistCategories.map((cat, index) => (
            <button
              key={index}
              className="px-4 py-2 bg-white border border-gray-100 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {cat.name}
            </button>
          ))
        )}
      </div>

      {/* 网友精选 */}
      <SectionHeader title="网友精选" />
      
      <div className="px-4 grid grid-cols-3 gap-3 pb-4">
        {loading ? (
          Array(9).fill(0).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="w-full aspect-square rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))
        ) : (
          topPlaylists.map(playlist => (
            <PlaylistCard 
              key={playlist.id}
              playlist={playlist}
              onClick={() => onPlaylistClick(playlist.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// 区块标题组件
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-4 mb-4 mt-6">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
    </div>
  );
}

// 歌单卡片组件
function PlaylistCard({ playlist, onClick }: { playlist: Playlist; onClick: () => void }) {
  return (
    <div className="cursor-pointer group" onClick={onClick}>
      <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-gray-100 shadow-sm">
        <img 
          src={api.getImageUrl(playlist.coverImgUrl || '', 200, 200)}
          alt={playlist.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-full">
          <Play className="w-2.5 h-2.5 fill-current" />
          {api.formatNumber(playlist.playCount || 0)}
        </div>
      </div>
      <p className="text-xs text-gray-800 font-medium line-clamp-2 leading-relaxed">
        {playlist.name}
      </p>
    </div>
  );
}
