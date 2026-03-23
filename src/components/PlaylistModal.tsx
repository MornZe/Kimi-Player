import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import * as api from '@/services/api';
import type { Song } from '@/types/music';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Song[];
  currentIndex: number;
  onPlayByIndex: (index: number) => void;
  onRemove: (index: number) => void;
}

export function PlaylistModal({
  isOpen,
  onClose,
  playlist,
  currentIndex,
  onPlayByIndex,
  onRemove
}: PlaylistModalProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl p-0">
        <SheetHeader className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-bold">
              播放列表 ({playlist.length})
            </SheetTitle>
            <Button variant="ghost" size="icon" className="w-9 h-9" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </SheetHeader>
        
        <div className="overflow-y-auto h-[calc(70vh-70px)] p-2">
          {playlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <p className="text-sm">播放列表为空</p>
            </div>
          ) : (
            <div className="space-y-1">
              {playlist.map((song, index) => (
                <div
                  key={`${song.id}-${index}`}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    currentIndex === index 
                      ? 'bg-red-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    onPlayByIndex(index);
                    onClose();
                  }}
                >
                  <span className={`w-6 text-center text-sm font-semibold ${
                    currentIndex === index ? 'text-red-600' : 'text-gray-400'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img 
                      src={api.getImageUrl(song.picUrl || '', 100, 100)}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      currentIndex === index ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {song.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{song.artist}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-gray-400 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(index);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
