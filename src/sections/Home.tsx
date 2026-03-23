import { useEffect, useState, useCallback } from 'react';
import { ChevronRight, Play } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import * as api from '@/services/api';
import type { Song, Playlist, Banner, Toplist } from '@/types/music';

interface HomeProps {
  onPlaylistClick: (id: number) => void;
  onSongClick: (id: number) => void;
  onSwitchTab: (tab: 'home' | 'search' | 'playlist' | 'profile') => void;
}

export function Home({ onPlaylistClick, onSongClick, onSwitchTab }: HomeProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [recommendPlaylists, setRecommendPlaylists] = useState<Playlist[]>([]);
  const [toplists, setToplists] = useState<Toplist[]>([]);
  const [newSongs, setNewSongs] = useState<Song[]>([]);
  const [newSongType, setNewSongType] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bannerLoading, setBannerLoading] = useState(true);

  const newSongTabs = [
    { type: 0, label: '全部' },
    { type: 7, label: '华语' },
    { type: 96, label: '欧美' },
    { type: 8, label: '日本' },
    { type: 16, label: '韩国' }
  ];

  // 加载首页数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const [bannerRes, playlistRes, toplistRes] = await Promise.all([
          api.fetchBanners(),
          api.fetchRecommendPlaylists(6),
          api.fetchToplists()
        ]);
        
        setBanners(bannerRes);
        setRecommendPlaylists(playlistRes);
        setToplists(toplistRes);
        setBannerLoading(false);
        
        // 加载新歌
        const newSongsRes = await api.fetchNewSongs(0);
        setNewSongs(newSongsRes);
        setLoading(false);
      } catch (error) {
        console.error('加载首页数据失败:', error);
        setLoading(false);
        setBannerLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Banner轮播
  useEffect(() => {
    if (banners.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [banners]);

  // 加载新歌
  const loadNewSongs = useCallback(async (type: number) => {
    setNewSongType(type);
    try {
      const res = await api.fetchNewSongs(type);
      setNewSongs(res);
    } catch (error) {
      console.error('加载新歌失败:', error);
    }
  }, []);

  // Banner点击
  const handleBannerClick = (banner: Banner) => {
    if (banner.targetType === 1000 && banner.targetId) {
      onPlaylistClick(banner.targetId);
    } else if (banner.targetType === 1 && banner.targetId) {
      onSongClick(banner.targetId);
    }
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-gradient-to-b from-white to-gray-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-5">发现音乐</h1>
        
        {/* Banner */}
        <div className="relative w-full h-36 rounded-2xl overflow-hidden shadow-lg">
          {bannerLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <>
              <div 
                className="flex h-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentBanner * 100}%)` }}
              >
                {banners.map((banner, index) => (
                  <div 
                    key={index}
                    className="min-w-full h-full cursor-pointer"
                    onClick={() => handleBannerClick(banner)}
                  >
                    <img 
                      src={api.getImageUrl(banner.imageUrl, 800, 300)}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
              
              {/* Banner指示器 */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentBanner ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                    }`}
                    onClick={() => setCurrentBanner(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 推荐歌单 */}
      <SectionHeader 
        title="推荐歌单" 
        moreText="更多"
        onMoreClick={() => onSwitchTab('playlist')}
      />
      
      <div className="px-4 grid grid-cols-3 gap-3 mb-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="w-full aspect-square rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))
        ) : (
          recommendPlaylists.map(playlist => (
            <PlaylistCard 
              key={playlist.id}
              playlist={playlist}
              onClick={() => onPlaylistClick(playlist.id)}
            />
          ))
        )}
      </div>

      {/* 新歌速递 */}
      <SectionHeader title="新歌速递" />
      
      {/* 新歌标签 */}
      <div className="px-4 flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {newSongTabs.map(tab => (
          <button
            key={tab.type}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              newSongType === tab.type
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
            }`}
            onClick={() => loadNewSongs(tab.type)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 新歌列表 */}
      <div className="px-4 mb-6">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <Skeleton className="w-11 h-11 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : (
          newSongs.map((song, index) => (
            <SongItem 
              key={song.id}
              song={song}
              index={index + 1}
              onClick={() => onSongClick(song.id)}
            />
          ))
        )}
      </div>

      {/* 排行榜 */}
      <SectionHeader title="排行榜" />
      
      <div className="px-4 pb-4">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <Skeleton className="w-8 h-4" />
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : (
          toplists.map((list, index) => (
            <RankItem 
              key={list.id}
              list={list}
              index={index}
              onClick={() => onPlaylistClick(list.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// 区块标题组件
function SectionHeader({ 
  title, 
  moreText, 
  onMoreClick 
}: { 
  title: string; 
  moreText?: string;
  onMoreClick?: () => void;
}) {
  return (
    <div className="flex justify-between items-center px-4 mb-4 mt-6">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {moreText && (
        <button 
          className="text-xs text-gray-500 flex items-center gap-0.5 hover:text-red-600 transition-colors"
          onClick={onMoreClick}
        >
          {moreText}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
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

// 歌曲项组件
function SongItem({ song, index, onClick }: { song: Song; index: number; onClick: () => void }) {
  const artists = song.artists || song.ar || [];
  const album = song.album || song.al || {};
  const duration = song.duration || song.dt || 0;
  const isVip = duration > 0 && duration < 60000;

  return (
    <div 
      className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors -mx-4 px-4"
      onClick={onClick}
    >
      <span className="w-6 text-center text-sm font-semibold text-gray-400">{index}</span>
      <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
        <img 
          src={api.getImageUrl(album.picUrl || '', 100, 100)}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">{song.name}</span>
          {isVip && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-[9px] px-1 py-0 border-0">
              VIP
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">
          {artists.map(a => a.name).join(' / ')} - {album.name || ''}
        </p>
      </div>
    </div>
  );
}

// 排行榜项组件
function RankItem({ list, index, onClick }: { list: Toplist; index: number; onClick: () => void }) {
  return (
    <div 
      className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors -mx-4 px-4"
      onClick={onClick}
    >
      <span className={`w-8 text-center text-base font-bold ${index < 3 ? 'text-red-600' : 'text-gray-300'}`}>
        {index + 1}
      </span>
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
        <img 
          src={api.getImageUrl(list.coverImgUrl || '', 100, 100)}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{list.name}</p>
        <p className="text-xs text-gray-500">{list.updateFrequency || '每日更新'}</p>
      </div>
    </div>
  );
}
