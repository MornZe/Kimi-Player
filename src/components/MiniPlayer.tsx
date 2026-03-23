import { Play, Pause, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as api from '@/services/api';
import type { Song } from '@/types/music';

interface MiniPlayerProps {
  song: Song | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onOpenFullPlayer: () => void;
}

export function MiniPlayer({ 
  song, 
  isPlaying, 
  onTogglePlay, 
  onNext, 
  onOpenFullPlayer 
}: MiniPlayerProps) {
  if (!song) return null;

  return (
    <div 
      className="fixed bottom-20 left-3 right-3 h-[60px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 flex items-center px-4 gap-3 z-50 animate-in slide-in-from-bottom-4 duration-300"
      onClick={onOpenFullPlayer}
    >
      {/* 封面 */}
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
        <img 
          src={api.getImageUrl(song.picUrl || '', 100, 100)}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* 歌曲信息 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{song.name}</p>
        <p className="text-xs text-gray-500 truncate">{song.artist}</p>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="icon"
          className="w-9 h-9 rounded-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 shadow-md shadow-red-200"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlay();
          }}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9 rounded-full text-gray-700"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
        >
          <SkipForward className="w-5 h-5 fill-current" />
        </Button>
      </div>
    </div>
  );
}
