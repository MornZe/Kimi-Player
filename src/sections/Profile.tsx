import { Mic2, Music, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as api from '@/services/api';
import type { Song } from '@/types/music';

interface ProfileProps {
  playHistory: Song[];
  playlist: Song[];
  currentIndex: number;
  onSongClick: (id: number) => void;
  onPlayByIndex: (index: number) => void;
  onRemoveFromPlaylist: (index: number) => void;
  onClearPlaylist: () => void;
}

export function Profile({ 
  playHistory, 
  playlist, 
  currentIndex,
  onSongClick, 
  onPlayByIndex, 
  onRemoveFromPlaylist,
  onClearPlaylist 
}: ProfileProps) {
  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-gradient-to-b from-white to-gray-50">
        <h1 className="text-2xl font-bold text-gray-900">我的音乐</h1>
      </div>

      {/* 播放历史 */}
      <SectionHeader title="播放历史" />
      
      <div className="px-4 mb-6">
        {playHistory.length === 0 ? (
          <EmptyState 
            icon={<Mic2 className="w-12 h-12" />}
            text="暂无播放记录"
          />
        ) : (
          <div className="space-y-1">
            {playHistory.slice(0, 20).map((song, index) => (
              <SongItem 
                key={`${song.id}-${index}`}
                song={song}
                index={index + 1}
                isPlaying={false}
                onClick={() => onSongClick(song.id)}
                showRemove={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* 当前播放列表 */}
      <div className="flex justify-between items-center px-4 mb-4 mt-6">
        <h2 className="text-base font-bold text-gray-900">当前播放列表</h2>
        {playlist.length > 0 && (
          <button 
            className="text-xs text-gray-500 hover:text-red-600 transition-colors"
            onClick={onClearPlaylist}
          >
            清空
          </button>
        )}
      </div>
      
      <div className="px-4 pb-4">
        {playlist.length === 0 ? (
          <EmptyState 
            icon={<Music className="w-12 h-12" />}
            text="播放列表为空"
          />
        ) : (
          <div className="space-y-1">
            {playlist.map((song, index) => (
              <SongItem 
                key={`${song.id}-${index}`}
                song={song}
                index={index + 1}
                isPlaying={currentIndex === index}
                onClick={() => onPlayByIndex(index)}
                onRemove={() => onRemoveFromPlaylist(index)}
                showRemove={true}
              />
            ))}
          </div>
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
  isPlaying, 
  onClick, 
  onRemove,
  showRemove 
}: { 
  song: Song; 
  index: number; 
  isPlaying: boolean;
  onClick: () => void;
  onRemove?: () => void;
  showRemove: boolean;
}) {
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
          src={api.getImageUrl(song.picUrl || '', 100, 100)}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium truncate block ${isPlaying ? 'text-red-600' : 'text-gray-900'}`}>
          {song.name}
        </span>
        <p className="text-xs text-gray-500 truncate">{song.artist}</p>
      </div>
      {showRemove && onRemove && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-8 h-8 text-gray-400 hover:text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

// 空状态组件
function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-300">
      {icon}
      <p className="text-sm text-gray-400 mt-3">{text}</p>
    </div>
  );
}
