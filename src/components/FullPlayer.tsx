import { useState, useEffect, useRef } from 'react';
import { ChevronDown, List, SkipBack, Play, Pause, SkipForward, Repeat, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import * as api from '@/services/api';
import type { Song, Lyric } from '@/types/music';

interface FullPlayerProps {
  song: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  mode: 'sequence' | 'random' | 'single';
  lyrics: Lyric[];
  yrcLyrics: Lyric[];
  currentLyricIndex: number;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSwitchMode: () => void;
  onSeek: (time: number) => void;
  onClose: () => void;
  onOpenPlaylist: () => void;
}

export function FullPlayer({
  song,
  isPlaying,
  currentTime,
  duration,
  mode,
  lyrics,
  yrcLyrics,
  currentLyricIndex,
  onTogglePlay,
  onPrev,
  onNext,
  onSwitchMode,
  onSeek,
  onClose,
  onOpenPlaylist
}: FullPlayerProps) {
  const lyricsRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  // 更新进度
  useEffect(() => {
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    }
  }, [currentTime, duration]);

  // 滚动歌词
  useEffect(() => {
    if (lyricsRef.current && currentLyricIndex >= 0) {
      const activeLine = lyricsRef.current.querySelector(`[data-index="${currentLyricIndex}"]`);
      if (activeLine) {
        const containerHeight = lyricsRef.current.offsetHeight;
        const lineTop = (activeLine as HTMLElement).offsetTop;
        const lineHeight = (activeLine as HTMLElement).offsetHeight;
        const scrollOffset = lineTop - containerHeight / 2 + lineHeight / 2;
        lyricsRef.current.scrollTo({
          top: Math.max(0, scrollOffset),
          behavior: 'smooth'
        });
      }
    }
  }, [currentLyricIndex]);

  if (!song) return null;

  const displayLyrics = yrcLyrics.length > 0 ? yrcLyrics : lyrics;

  // 模式图标
  const modeIcons = {
    sequence: <Repeat className="w-5 h-5" />,
    random: <Shuffle className="w-5 h-5" />,
    single: <Repeat className="w-5 h-5" />
  };

  const modeNames = {
    sequence: '顺序播放',
    random: '随机播放',
    single: '单曲循环'
  };

  return (
    <div className="fixed inset-0 z-[200] bg-gradient-to-b from-gray-50 via-gray-50 to-white flex flex-col">
      {/* 背景模糊 */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `url(${api.getImageUrl(song.picUrl || '', 100, 100)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(80px) brightness(1.2) saturate(1.2)'
        }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between px-4 pt-12 pb-4 bg-white/80 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full"
          onClick={onClose}
        >
          <ChevronDown className="w-6 h-6" />
        </Button>
        <span className="text-sm font-medium text-gray-600">正在播放</span>
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full"
          onClick={onOpenPlaylist}
        >
          <List className="w-5 h-5" />
        </Button>
      </div>

      {/* 内容区 */}
      <div className="relative flex-1 flex flex-col items-center justify-between px-6 py-6 overflow-hidden">
        {/* 封面 */}
        <div className="w-64 h-64 rounded-3xl overflow-hidden shadow-2xl shadow-gray-300/50 bg-gray-100">
          <img 
            src={api.getImageUrl(song.picUrl || '', 400, 400)}
            alt=""
            className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
            style={{ animationDuration: '20s' }}
          />
        </div>

        {/* 歌曲信息 */}
        <div className="text-center mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 truncate max-w-[280px]">
            {song.name}
          </h2>
          <p className="text-sm text-gray-500">{song.artist}</p>
        </div>

        {/* 歌词 */}
        <div 
          ref={lyricsRef}
          className="flex-1 w-full max-w-[320px] mt-6 overflow-y-auto scrollbar-hide"
        >
          {displayLyrics.length > 0 ? (
            <div className="space-y-4 py-20">
              {displayLyrics.map((line, index) => (
                <p
                  key={index}
                  data-index={index}
                  className={`text-center text-sm transition-all duration-300 ${
                    index === currentLyricIndex
                      ? 'text-gray-900 font-semibold text-base scale-105'
                      : 'text-gray-400'
                  }`}
                >
                  {line.words && line.words.length > 0 ? (
                    line.words.map((word, wIndex) => (
                      <span
                        key={wIndex}
                        className={`inline-block transition-all duration-200 ${
                          index === currentLyricIndex && 
                          currentTime >= word.startTime && 
                          currentTime < word.startTime + word.duration
                            ? 'text-red-600 scale-110'
                            : ''
                        }`}
                      >
                        {word.text}
                      </span>
                    ))
                  ) : (
                    line.text
                  )}
                </p>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              暂无歌词
            </div>
          )}
        </div>

        {/* 进度条 */}
        <div className="w-full max-w-[360px] mt-6">
          <Slider
            value={[progress]}
            max={100}
            step={0.1}
            className="w-full"
            onValueChange={(value) => {
              const newTime = (value[0] / 100) * duration;
              onSeek(newTime);
            }}
          />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{api.formatTime(currentTime)}</span>
            <span>{api.formatTime(duration)}</span>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-between w-full max-w-[360px] mt-6">
          {/* 模式按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className={`w-12 h-12 rounded-full ${mode !== 'sequence' ? 'text-red-600' : 'text-gray-600'}`}
            onClick={onSwitchMode}
            title={modeNames[mode]}
          >
            {modeIcons[mode]}
          </Button>

          {/* 上一首 */}
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full text-gray-800"
            onClick={onPrev}
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </Button>

          {/* 播放/暂停 */}
          <Button
            variant="default"
            size="icon"
            className="w-16 h-16 rounded-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 shadow-xl shadow-red-200"
            onClick={onTogglePlay}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </Button>

          {/* 下一首 */}
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full text-gray-800"
            onClick={onNext}
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </Button>

          {/* 播放列表 */}
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full text-gray-600"
            onClick={onOpenPlaylist}
          >
            <List className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
