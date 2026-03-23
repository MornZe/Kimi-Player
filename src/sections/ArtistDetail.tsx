import { ChevronLeft } from 'lucide-react';
import * as api from '@/services/api';
import type { Artist, Song, Album } from '@/types/music';

interface ArtistDetailProps {
  artist: Artist | null;
  hotSongs: Song[];
  albums: Album[];
  onBack: () => void;
  onSongClick: (id: number) => void;
}

export function ArtistDetail({ 
  artist, 
  hotSongs, 
  albums, 
  onBack, 
  onSongClick 
}: ArtistDetailProps) {
  if (!artist) {
    return (
      <div className="pb-20">
        <div className="px-4 pt-12 pb-4">
          <button onClick={onBack} className="mb-4">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <p className="text-center text-gray-500 py-12">歌手不存在</p>
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

        {/* 歌手信息 */}
        <div className="flex gap-4 mt-2">
          {/* 头像 */}
          <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 shadow-lg">
            <img 
              src={api.getImageUrl(artist.picUrl || '', 300, 300)}
              alt={artist.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* 信息 */}
          <div className="flex-1 min-w-0 pt-4">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {artist.name}
            </h1>
            <p className="text-xs text-gray-500 line-clamp-2">
              {artist.alias?.join(' / ') || '热门歌手'}
            </p>
          </div>
        </div>
      </div>

      {/* 热门歌曲 */}
      <SectionHeader title="热门歌曲" />
      
      <div className="px-4 mb-6">
        {hotSongs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">暂无热门歌曲</p>
          </div>
        ) : (
          <div className="space-y-1">
            {hotSongs.slice(0, 10).map((song, index) => (
              <SongItem 
                key={song.id}
                song={song}
                index={index + 1}
                onClick={() => onSongClick(song.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 专辑 */}
      <SectionHeader title="专辑" />
      
      <div className="px-4 grid grid-cols-3 gap-3 pb-4">
        {albums.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-gray-400">
            <p className="text-sm">暂无专辑</p>
          </div>
        ) : (
          albums.map(album => (
            <div key={album.id} className="cursor-pointer">
              <div className="aspect-square rounded-xl overflow-hidden mb-2 bg-gray-100 shadow-sm">
                <img 
                  src={api.getImageUrl(album.picUrl || '', 200, 200)}
                  alt={album.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <p className="text-xs font-medium text-gray-800 line-clamp-2">{album.name}</p>
            </div>
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

// 歌曲项组件
function SongItem({ 
  song, 
  index, 
  onClick 
}: { 
  song: Song; 
  index: number; 
  onClick: () => void;
}) {
  const album = song.al || song.album || {};

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
        <span className="text-sm font-medium text-gray-900 truncate block">
          {song.name}
        </span>
        <p className="text-xs text-gray-500 truncate">{album.name || ''}</p>
      </div>
    </div>
  );
}
