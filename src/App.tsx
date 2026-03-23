import { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { Home } from '@/sections/Home';
import { Search } from '@/sections/Search';
import { PlaylistSquare } from '@/sections/PlaylistSquare';
import { Profile } from '@/sections/Profile';
import { PlaylistDetail } from '@/sections/PlaylistDetail';
import { ArtistDetail } from '@/sections/ArtistDetail';
import { MiniPlayer } from '@/components/MiniPlayer';
import { FullPlayer } from '@/components/FullPlayer';
import { PlaylistModal } from '@/components/PlaylistModal';
import { BottomNav } from '@/components/BottomNav';
import * as api from '@/services/api';
import type { Song, Playlist, Artist } from '@/types/music';

function App() {
  // 当前页面状态
  const [currentTab, setCurrentTab] = useState<'home' | 'search' | 'playlist' | 'profile'>('home');
  const [currentPage, setCurrentPage] = useState<'main' | 'playlistDetail' | 'artistDetail'>('main');
  
  // 播放器状态
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mode, setMode] = useState<'sequence' | 'random' | 'single'>('sequence');
  const [lyrics, setLyrics] = useState<any[]>([]);
  const [yrcLyrics, setYrcLyrics] = useState<any[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  
  // UI状态
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  
  // 详情页数据
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [currentPlaylistSongs, setCurrentPlaylistSongs] = useState<Song[]>([]);
  const [currentArtist, setCurrentArtist] = useState<Artist | null>(null);
  const [artistHotSongs, setArtistHotSongs] = useState<Song[]>([]);
  const [artistAlbums, setArtistAlbums] = useState<any[]>([]);
  
  // 播放历史
  const [playHistory, setPlayHistory] = useState<Song[]>([]);
  
  // 音频元素
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // 初始化音频
  useEffect(() => {
    const newAudio = new Audio();
    newAudio.preload = 'metadata';
    
    newAudio.addEventListener('timeupdate', () => {
      setCurrentTime(newAudio.currentTime);
    });
    
    newAudio.addEventListener('loadedmetadata', () => {
      setDuration(newAudio.duration);
    });
    
    newAudio.addEventListener('ended', () => {
      handleSongEnd();
    });
    
    newAudio.addEventListener('error', () => {
      toast.error('播放失败，尝试下一首');
      setTimeout(playNext, 1000);
    });
    
    setAudio(newAudio);
    
    // 加载本地数据
    loadPlayHistory();
    loadPlaylist();
    
    return () => {
      newAudio.pause();
    };
  }, []);

  // 加载播放历史
  const loadPlayHistory = () => {
    try {
      const saved = localStorage.getItem('kodemusic_history');
      if (saved) {
        setPlayHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('加载播放历史失败:', e);
    }
  };

  // 加载播放列表
  const loadPlaylist = () => {
    try {
      const saved = localStorage.getItem('kodemusic_playlist');
      if (saved) {
        const { playlist: savedPlaylist, currentIndex: savedIndex } = JSON.parse(saved);
        setPlaylist(savedPlaylist || []);
        setCurrentIndex(savedIndex || -1);
        if (savedPlaylist?.[savedIndex]) {
          setCurrentSong(savedPlaylist[savedIndex]);
        }
      }
    } catch (e) {
      console.error('加载播放列表失败:', e);
    }
  };

  // 保存播放列表
  const savePlaylist = (newPlaylist: Song[], newIndex: number) => {
    try {
      localStorage.setItem('kodemusic_playlist', JSON.stringify({
        playlist: newPlaylist,
        currentIndex: newIndex
      }));
    } catch (e) {
      console.error('保存播放列表失败:', e);
    }
  };

  // 添加到播放历史
  const addToHistory = (song: Song) => {
    if (!song?.id) return;
    
    setPlayHistory(prev => {
      const filtered = prev.filter(s => s.id !== song.id);
      const newHistory = [{ ...song, playedAt: Date.now() }, ...filtered].slice(0, 50);
      
      try {
        localStorage.setItem('kodemusic_history', JSON.stringify(newHistory));
      } catch (e) {
        console.error('保存播放历史失败:', e);
      }
      
      return newHistory;
    });
  };

  // 播放歌曲
  const playSong = useCallback(async (id: number) => {
    if (!id || !audio) return;
    
    try {
      const checkRes = await api.checkMusic(id);
      if (!checkRes.success) {
        toast.error(checkRes.message || '暂无版权');
        return;
      }
      
      const [url, detail] = await Promise.all([
        api.fetchSongUrl(id),
        api.fetchSongDetail(id)
      ]);
      
      if (!url || !detail) {
        toast.error('获取播放链接失败');
        return;
      }
      
      const artists = detail.ar || [];
      const songData: Song = {
        id,
        name: detail.name || '未知歌曲',
        artist: artists.map((a: Artist) => a.name).join(' / ') || '未知歌手',
        picUrl: detail.al?.picUrl || '',
        url
      };
      
      setCurrentSong(songData);
      
      // 添加到播放列表
      const existingIndex = playlist.findIndex(s => s.id === id);
      let newPlaylist = [...playlist];
      let newIndex: number;
      
      if (existingIndex === -1) {
        newPlaylist.push(songData);
        newIndex = newPlaylist.length - 1;
      } else {
        newIndex = existingIndex;
        newPlaylist[existingIndex] = songData;
      }
      
      setPlaylist(newPlaylist);
      setCurrentIndex(newIndex);
      
      // 设置音频源并播放
      audio.src = url;
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
      
      // 加载歌词
      loadLyrics(id);
      
      // 添加到历史
      addToHistory(songData);
      savePlaylist(newPlaylist, newIndex);
      
    } catch (error) {
      console.error('播放失败:', error);
      toast.error('播放失败');
    }
  }, [audio, playlist]);

  // 通过索引播放
  const playSongByIndex = useCallback(async (index: number) => {
    if (index < 0 || index >= playlist.length || !audio) return;
    
    setCurrentIndex(index);
    const song = playlist[index];
    
    if (!song?.id) {
      playNext();
      return;
    }
    
    try {
      const checkRes = await api.checkMusic(song.id);
      if (!checkRes.success) {
        toast.error('暂无版权，跳过');
        setTimeout(playNext, 1000);
        return;
      }
      
      const url = await api.fetchSongUrl(song.id);
      if (!url) {
        toast.error('获取链接失败，跳过');
        setTimeout(playNext, 1000);
        return;
      }
      
      song.url = url;
      setCurrentSong(song);
      
      audio.src = url;
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
      
      loadLyrics(song.id);
      addToHistory(song);
      
    } catch (error) {
      console.error('播放失败:', error);
      toast.error('播放失败，跳过');
      setTimeout(playNext, 1000);
    }
  }, [playlist, audio]);

  // 切换播放/暂停
  const togglePlay = useCallback(() => {
    if (!currentSong || !audio) {
      toast.info('请先选择歌曲');
      return;
    }
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [currentSong, isPlaying, audio]);

  // 播放下一首
  const playNext = useCallback(() => {
    if (playlist.length === 0) {
      toast.info('播放列表为空');
      return;
    }
    
    let nextIndex: number;
    
    if (mode === 'random') {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else if (mode === 'single') {
      nextIndex = currentIndex;
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= playlist.length) {
        nextIndex = 0;
      }
    }
    
    playSongByIndex(nextIndex);
  }, [playlist, currentIndex, mode, playSongByIndex]);

  // 播放上一首
  const playPrev = useCallback(() => {
    if (playlist.length === 0) {
      toast.info('播放列表为空');
      return;
    }
    
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = playlist.length - 1;
    }
    
    playSongByIndex(prevIndex);
  }, [playlist, currentIndex, playSongByIndex]);

  // 歌曲结束处理
  const handleSongEnd = useCallback(() => {
    if (mode === 'single') {
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    } else {
      playNext();
    }
  }, [mode, playNext, audio]);

  // 切换播放模式
  const switchMode = useCallback(() => {
    const modes: ('sequence' | 'random' | 'single')[] = ['sequence', 'random', 'single'];
    const modeNames = {
      sequence: '顺序播放',
      random: '随机播放',
      single: '单曲循环'
    };
    const currentModeIndex = modes.indexOf(mode);
    const newMode = modes[(currentModeIndex + 1) % modes.length];
    setMode(newMode);
    toast.info(modeNames[newMode]);
  }, [mode]);

  // 加载歌词
  const loadLyrics = async (id: number) => {
    if (!id) {
      setLyrics([]);
      setYrcLyrics([]);
      return;
    }
    
    try {
      const res = await api.fetchLyrics(id);
      
      if (res) {
        setLyrics([]);
        setYrcLyrics([]);
        setCurrentLyricIndex(-1);
        
        if (res.yrc?.lyric) {
          setYrcLyrics(parseYrcLyrics(res.yrc.lyric));
        }
        
        if (res.lrc?.lyric) {
          setLyrics(parseLyrics(res.lrc.lyric));
        }
      }
    } catch (error) {
      console.error('加载歌词失败:', error);
      setLyrics([]);
      setYrcLyrics([]);
    }
  };

  // 解析歌词
  const parseLyrics = (lrcText: string) => {
    if (!lrcText) return [];
    
    const lines = lrcText.split('\n');
    const lyrics: any[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
    
    lines.forEach(line => {
      const match = timeRegex.exec(line);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const ms = parseInt(match[3].padEnd(3, '0'));
        const time = minutes * 60 + seconds + ms / 1000;
        const text = line.replace(timeRegex, '').trim();
        
        if (text) {
          lyrics.push({ time, text });
        }
      }
    });
    
    return lyrics.sort((a, b) => a.time - b.time);
  };

  // 解析逐字歌词
  const parseYrcLyrics = (yrcText: string) => {
    if (!yrcText) return [];
    
    const lines = yrcText.split('\n');
    const lyrics: any[] = [];
    const lineRegex = /\[(\d+),(\d+)\]/;
    const wordRegex = /\((\d+),(\d+),\d+\)([^\(]+)/g;
    
    lines.forEach(line => {
      const lineMatch = lineRegex.exec(line);
      if (lineMatch) {
        const startTime = parseInt(lineMatch[1]) / 1000;
        const duration = parseInt(lineMatch[2]) / 1000;
        const words: any[] = [];
        const textPart = line.substring(lineMatch[0].length);
        
        let wordMatch;
        while ((wordMatch = wordRegex.exec(textPart)) !== null) {
          const wordStart = parseInt(wordMatch[1]) / 1000;
          const wordDuration = parseInt(wordMatch[2]) / 1000;
          const wordText = wordMatch[3];
          
          if (wordText) {
            words.push({
              text: wordText,
              startTime: wordStart,
              duration: wordDuration
            });
          }
        }
        
        if (words.length === 0) {
          const text = textPart.replace(/\(\d+,\d+,\d+\)/g, '').trim();
          if (text) {
            lyrics.push({ time: startTime, duration, text, words: [] });
          }
        } else {
          const fullText = words.map(w => w.text).join('');
          lyrics.push({ time: startTime, duration, text: fullText, words });
        }
      }
    });
    
    return lyrics.sort((a, b) => a.time - b.time);
  };

  // 跳转到指定时间
  const seekTo = (time: number) => {
    if (audio && !isNaN(time)) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  };

  // 从播放列表移除
  const removeFromPlaylist = (index: number) => {
    if (index < 0 || index >= playlist.length) return;
    
    const newPlaylist = [...playlist];
    newPlaylist.splice(index, 1);
    setPlaylist(newPlaylist);
    
    if (currentIndex === index) {
      if (newPlaylist.length > 0) {
        playSongByIndex(Math.min(index, newPlaylist.length - 1));
      } else {
        setCurrentSong(null);
        setCurrentIndex(-1);
        setIsPlaying(false);
        if (audio) {
          audio.pause();
        }
      }
    } else if (currentIndex > index) {
      setCurrentIndex(currentIndex - 1);
    }
    
    savePlaylist(newPlaylist, currentIndex > index ? currentIndex - 1 : currentIndex);
  };

  // 清空播放列表
  const clearPlaylist = () => {
    setPlaylist([]);
    setCurrentIndex(-1);
    setCurrentSong(null);
    setIsPlaying(false);
    if (audio) {
      audio.pause();
    }
    savePlaylist([], -1);
    toast.success('已清空播放列表');
  };

  // 打开歌单详情
  const openPlaylistDetail = async (id: number) => {
    try {
      const [detail, songs] = await Promise.all([
        api.fetchPlaylistDetail(id),
        api.fetchPlaylistSongs(id)
      ]);
      
      if (detail) {
        setCurrentPlaylist(detail);
        setCurrentPlaylistSongs(songs);
        setCurrentPage('playlistDetail');
      } else {
        toast.error('歌单不存在或已删除');
      }
    } catch (error) {
      console.error('加载歌单失败:', error);
      toast.error('加载失败，请重试');
    }
  };

  // 打开歌手详情
  const openArtistDetail = async (id: number) => {
    try {
      const res = await api.fetchArtistDetail(id);
      
      if (res) {
        setCurrentArtist(res.artist);
        setArtistHotSongs(res.hotSongs);
        
        // 加载专辑
        const albums = await api.fetchArtistAlbums(id, 6);
        setArtistAlbums(albums);
        
        setCurrentPage('artistDetail');
      } else {
        toast.error('歌手不存在');
      }
    } catch (error) {
      console.error('加载歌手失败:', error);
      toast.error('加载失败');
    }
  };

  // 播放歌单全部
  const playPlaylistAll = () => {
    if (currentPlaylistSongs.length === 0) {
      toast.info('歌单为空');
      return;
    }
    
    setPlaylist(currentPlaylistSongs);
    setCurrentIndex(0);
    playSongByIndex(0);
    savePlaylist(currentPlaylistSongs, 0);
  };

  // 播放歌单中的歌曲
  const playPlaylistSong = (index: number) => {
    if (index < 0 || index >= currentPlaylistSongs.length) return;
    
    setPlaylist(currentPlaylistSongs);
    setCurrentIndex(index);
    playSongByIndex(index);
    savePlaylist(currentPlaylistSongs, index);
  };

  // 返回主页
  const goBack = () => {
    setCurrentPage('main');
    setCurrentPlaylist(null);
    setCurrentPlaylistSongs([]);
    setCurrentArtist(null);
    setArtistHotSongs([]);
    setArtistAlbums([]);
  };

  // 渲染当前页面
  const renderPage = () => {
    if (currentPage === 'playlistDetail') {
      return (
        <PlaylistDetail
          playlist={currentPlaylist}
          songs={currentPlaylistSongs}
          onBack={goBack}
          onPlayAll={playPlaylistAll}
          onPlaySong={playPlaylistSong}
          currentSongId={currentSong?.id}
        />
      );
    }

    if (currentPage === 'artistDetail') {
      return (
        <ArtistDetail
          artist={currentArtist}
          hotSongs={artistHotSongs}
          albums={artistAlbums}
          onBack={goBack}
          onSongClick={playSong}
        />
      );
    }

    // 主页面
    switch (currentTab) {
      case 'home':
        return (
          <Home
            onPlaylistClick={openPlaylistDetail}
            onSongClick={playSong}
            onSwitchTab={setCurrentTab}
          />
        );
      case 'search':
        return (
          <Search
            onSongClick={playSong}
            onPlaylistClick={openPlaylistDetail}
            onArtistClick={openArtistDetail}
          />
        );
      case 'playlist':
        return (
          <PlaylistSquare
            onPlaylistClick={openPlaylistDetail}
          />
        );
      case 'profile':
        return (
          <Profile
            playHistory={playHistory}
            playlist={playlist}
            currentIndex={currentIndex}
            onSongClick={playSong}
            onPlayByIndex={playSongByIndex}
            onRemoveFromPlaylist={removeFromPlaylist}
            onClearPlaylist={clearPlaylist}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      
      {/* 主内容 */}
      <main className="pb-20">
        {renderPage()}
      </main>

      {/* 迷你播放器 */}
      {currentSong && (
        <MiniPlayer
          song={currentSong}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onNext={playNext}
          onOpenFullPlayer={() => setShowFullPlayer(true)}
        />
      )}

      {/* 全屏播放器 */}
      {showFullPlayer && (
        <FullPlayer
          song={currentSong}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          mode={mode}
          lyrics={lyrics}
          yrcLyrics={yrcLyrics}
          currentLyricIndex={currentLyricIndex}
          onTogglePlay={togglePlay}
          onPrev={playPrev}
          onNext={playNext}
          onSwitchMode={switchMode}
          onSeek={seekTo}
          onClose={() => setShowFullPlayer(false)}
          onOpenPlaylist={() => setShowPlaylistModal(true)}
        />
      )}

      {/* 播放列表弹窗 */}
      <PlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        playlist={playlist}
        currentIndex={currentIndex}
        onPlayByIndex={playSongByIndex}
        onRemove={removeFromPlaylist}
      />

      {/* 底部导航 */}
      {currentPage === 'main' && (
        <BottomNav
          currentTab={currentTab}
          onTabChange={setCurrentTab}
        />
      )}
    </div>
  );
}

export default App;
