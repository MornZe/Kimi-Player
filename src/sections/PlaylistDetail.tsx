import { useState } from 'react';
import { ChevronLeft, Play, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import * as api from '@/services/api';
import type { Playlist, Song } from '@/types/music';

interface PlaylistDetailProps {
  playlist: Playlist | null;
  songs: Song[];
  onBack: () => void;
  onPlayAll: () => void;
  onPlaySong: (index: number) => void;
  currentSongId?: number;
}

export function PlaylistDetail({ 
  playlist, 
  songs, 
  onBack, 
  onPlayAll, 
  onPlaySong,
  currentSongId 
}: PlaylistDetailProps) {
  const [loading] = useState(!playlist);

  if (loading && !playlist) {
    return (
      <div className="pb-20">
        <div className="px-4 pt-12 pb-6 bg-gradient-to-b from-white to-gray-50">
          <div className="flex gap-4">
            <Skeleton className="w-28 h-28 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
        <div className="px-4 space-y-3 mt-4">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="w-6 h-4" />
              <Skeleton className="w-11 h-11 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="pb-20">
        <div className="px-4 pt-12 pb-4">
          <button onClick={onBack} className="mb-4">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <p className="text-center text-gray-500 py-12">歌单不存在或已删除</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="relative px-4 pt-12 pb-6 bg-gradient-to-b from-white to-gray-50 border-b border-gray-100">
        {/* 返回按钮 */}
        <button 
          onClick={onBack}
          className="absolute top-12 left-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-gray-100 transition-colors z-10"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* 歌单信息 */}
        <div className="flex gap-4 mt-2">
          {/* 封面 */}
          <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-lg">
            <img 
              src={api.getImageUrl(playlist.coverImgUrl || '', 300, 300)}
              alt={playlist.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* 信息 */}
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-lg font-bold text-gray-900 line-clamp-2 mb-1.5">
              {playlist.name}
            </h1>
            <p className="text-xs text-gray-600 mb-2">
              by {playlist.creator?.nickname || '未知用户'}
            </p>
            <p className="text-[11px] text-gray-400 mb-3">
              播放 {api.formatNumber(playlist.playCount || 0)} · 收藏 {api.formatNumber(playlist.subscribedCount || 0)}
            </p>
            <p className="text-xs text-gray-500 line-clamp-2">
              {playlist.description || '暂无简介'}
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 mt-5">
          <Button 
            className="flex-1 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-white rounded-full h-11 shadow-lg shadow-red-200"
            onClick={onPlayAll}
          >
            <Play className="w-4 h-4 mr-2 fill-current" />
            全部播放
          </Button>
          <Button 
            variant="outline"
            className="flex-1 rounded-full h-11 border-gray-200"
          >
            <Heart className="w-4 h-4 mr-2" />
            收藏
          </Button>
        </div>
      </div>

      {/* 歌曲列表 */}
      <div className="px-4 py-4">
        {songs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">暂无歌曲</p>
          </div>
        ) : (
          <div className="space-y-1">
            {songs.map((song, index) => (
              <SongItem 
                key={song.id}
                song={song}
                index={index + 1}
                isPlaying={currentSongId === song.id}
                onClick={() => onPlaySong(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 歌曲项组件
function SongItem({ 
  song, 
  index, 
  isPlaying, 
  onClick 
}: { 
  song: Song; 
  index: number; 
  isPlaying: boolean;
  onClick: () => void;
}) {
  const artists = song.ar || song.artists || [];
  const album = song.al || song.album || {};
  const duration = song.dt || song.duration || 0;
  const isVip = duration > 0 && duration < 60000;

  return (
    <div 
      className={`flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors -mx-4 px-4 ${
        isPlaying ? 'bg-red-50' : ''
      }`}
      onClick={onClick}
    >
      <span className={`w-6 text-center text-sm font-semibold ${isPlaying ? 'text-red-600' : 'text-gray-400'}`}>
        {index}
      </span>
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
          <span className={`text-sm font-medium truncate ${isPlaying ? 'text-red-600' : 'text-gray-900'}`}>
            {song.name}
          </span>
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
