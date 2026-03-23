import { useState, useRef, useCallback, useEffect } from 'react';
import type { Song, Playlist, Banner, HotSearch, Toplist, Artist, Lyric } from '@/types/music';
import * as api from '@/services/api';

const PLAY_HISTORY_KEY = 'kodemusic_history';
const CURRENT_PLAYLIST_KEY = 'kodemusic_playlist';

export function useMusicStore() {
  // 播放器状态
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mode, setMode] = useState<'sequence' | 'random' | 'single'>('sequence');
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [yrcLyrics, setYrcLyrics] = useState<Lyric[]>([]);
  const [translateLyrics, setTranslateLyrics] = useState<Lyric[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);

  // 应用状态
  const [currentTab, setCurrentTab] = useState<'home' | 'search' | 'playlist' | 'profile'>('home');
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [recommendPlaylists, setRecommendPlaylists] = useState<Playlist[]>([]);
  const [highqualityPlaylists, setHighqualityPlaylists] = useState<Playlist[]>([]);
  const [playlistCategories, setPlaylistCategories] = useState<{ name: string }[]>([]);
  const [toplists, setToplists] = useState<Toplist[]>([]);
  const [hotSearch, setHotSearch] = useState<HotSearch[]>([]);
  const [newSongs, setNewSongs] = useState<Song[]>([]);
  const [newSongType, setNewSongType] = useState(0);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [currentPlaylistSongs, setCurrentPlaylistSongs] = useState<Song[]>([]);
  const [currentArtist, setCurrentArtist] = useState<Artist | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState(1);
  const [searchResults, setSearchResults] = useState<Record<number, any>>({});
  const [playHistory, setPlayHistory] = useState<Song[]>([]);

  // 初始化音频元素
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = 'metadata';
    
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    
    const handleEnded = () => {
      handleSongEnd();
    };
    
    const handleError = () => {
      console.error('音频播放错误');
      setTimeout(playNext, 1000);
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    // 加载播放历史和播放列表
    loadPlayHistory();
    loadPlaylist();
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // 更新歌词
  useEffect(() => {
    if (yrcLyrics.length > 0) {
      updateYrcLyrics(currentTime);
    } else if (lyrics.length > 0) {
      updateNormalLyrics(currentTime);
    }
  }, [currentTime, lyrics, yrcLyrics]);

  // 播放歌曲
  const playSong = useCallback(async (id: number) => {
    if (!id) return;
    
    try {
      const checkRes = await api.checkMusic(id);
      if (!checkRes.success) {
        return;
      }
      
      const [url, detail] = await Promise.all([
        api.fetchSongUrl(id),
        api.fetchSongDetail(id)
      ]);
      
      if (!url || !detail) return;
      
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
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      }
      
      // 加载歌词
      loadLyrics(id);
      
      // 添加到历史
      addToHistory(songData);
      savePlaylist(newPlaylist, newIndex);
      
    } catch (error) {
      console.error('播放失败:', error);
    }
  }, [playlist]);

  // 通过索引播放
  const playSongByIndex = useCallback(async (index: number) => {
    if (index < 0 || index >= playlist.length) return;
    
    setCurrentIndex(index);
    const song = playlist[index];
    
    if (!song?.id) {
      playNext();
      return;
    }
    
    try {
      const checkRes = await api.checkMusic(song.id);
      if (!checkRes.success) {
        setTimeout(playNext, 1000);
        return;
      }
      
      const url = await api.fetchSongUrl(song.id);
      if (!url) {
        setTimeout(playNext, 1000);
        return;
      }
      
      song.url = url;
      setCurrentSong(song);
      
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      }
      
      loadLyrics(song.id);
      addToHistory(song);
      
    } catch (error) {
      console.error('播放失败:', error);
      setTimeout(playNext, 1000);
    }
  }, [playlist]);

  // 切换播放/暂停
  const togglePlay = useCallback(() => {
    if (!currentSong || !audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [currentSong, isPlaying]);

  // 播放下一首
  const playNext = useCallback(() => {
    if (playlist.length === 0) return;
    
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
    if (playlist.length === 0) return;
    
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = playlist.length - 1;
    }
    
    playSongByIndex(prevIndex);
  }, [playlist, currentIndex, playSongByIndex]);

  // 歌曲结束处理
  const handleSongEnd = useCallback(() => {
    if (mode === 'single') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } else {
      playNext();
    }
  }, [mode, playNext]);

  // 切换播放模式
  const switchMode = useCallback(() => {
    const modes: ('sequence' | 'random' | 'single')[] = ['sequence', 'random', 'single'];
    const currentModeIndex = modes.indexOf(mode);
    setMode(modes[(currentModeIndex + 1) % modes.length]);
  }, [mode]);

  // 加载歌词
  const loadLyrics = useCallback(async (id: number) => {
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
        setTranslateLyrics([]);
        setCurrentLyricIndex(-1);
        
        if (res.yrc?.lyric) {
          setYrcLyrics(parseYrcLyrics(res.yrc.lyric));
        }
        
        if (res.lrc?.lyric) {
          setLyrics(parseLyrics(res.lrc.lyric));
        }
        
        if (res.tlyric?.lyric) {
          setTranslateLyrics(parseLyrics(res.tlyric.lyric));
        }
      }
    } catch (error) {
      console.error('加载歌词失败:', error);
      setLyrics([]);
      setYrcLyrics([]);
    }
  }, []);

  // 解析歌词
  const parseLyrics = (lrcText: string): Lyric[] => {
    if (!lrcText) return [];
    
    const lines = lrcText.split('\n');
    const lyrics: Lyric[] = [];
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
  const parseYrcLyrics = (yrcText: string): Lyric[] => {
    if (!yrcText) return [];
    
    const lines = yrcText.split('\n');
    const lyrics: Lyric[] = [];
    const lineRegex = /\[(\d+),(\d+)\]/;
    const wordRegex = /\((\d+),(\d+),\d+\)([^\(]+)/g;
    
    lines.forEach(line => {
      const lineMatch = lineRegex.exec(line);
      if (lineMatch) {
        const startTime = parseInt(lineMatch[1]) / 1000;
        const duration = parseInt(lineMatch[2]) / 1000;
        const words: Lyric['words'] = [];
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

  // 更新普通歌词
  const updateNormalLyrics = (currentTime: number) => {
    if (!lyrics.length) return;
    
    let index = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    
    if (index !== currentLyricIndex) {
      setCurrentLyricIndex(index);
    }
  };

  // 更新逐字歌词
  const updateYrcLyrics = (currentTime: number) => {
    if (!yrcLyrics.length) return;
    
    let lineIndex = -1;
    
    for (let i = 0; i < yrcLyrics.length; i++) {
      const line = yrcLyrics[i];
      const lineEndTime = line.time + (line.duration || 0);
      
      if (currentTime >= line.time && currentTime < lineEndTime) {
        lineIndex = i;
        break;
      } else if (currentTime >= lineEndTime) {
        lineIndex = i;
      }
    }
    
    if (lineIndex !== currentLyricIndex) {
      setCurrentLyricIndex(lineIndex);
    }
  };

  // 添加到播放历史
  const addToHistory = (song: Song) => {
    if (!song?.id) return;
    
    setPlayHistory(prev => {
      const filtered = prev.filter(s => s.id !== song.id);
      const newHistory = [{ ...song, playedAt: Date.now() }, ...filtered].slice(0, 50);
      
      try {
        localStorage.setItem(PLAY_HISTORY_KEY, JSON.stringify(newHistory));
      } catch (e) {
        console.error('保存播放历史失败:', e);
      }
      
      return newHistory;
    });
  };

  // 加载播放历史
  const loadPlayHistory = () => {
    try {
      const saved = localStorage.getItem(PLAY_HISTORY_KEY);
      if (saved) {
        setPlayHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('加载播放历史失败:', e);
    }
  };

  // 保存播放列表
  const savePlaylist = (newPlaylist: Song[], newIndex: number) => {
    try {
      localStorage.setItem(CURRENT_PLAYLIST_KEY, JSON.stringify({
        playlist: newPlaylist,
        currentIndex: newIndex
      }));
    } catch (e) {
      console.error('保存播放列表失败:', e);
    }
  };

  // 加载播放列表
  const loadPlaylist = () => {
    try {
      const saved = localStorage.getItem(CURRENT_PLAYLIST_KEY);
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
        if (audioRef.current) {
          audioRef.current.pause();
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
    if (audioRef.current) {
      audioRef.current.pause();
    }
    savePlaylist([], -1);
  };

  // 跳转到指定时间
  const seekTo = (time: number) => {
    if (audioRef.current && !isNaN(time)) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // 导航
  const navigateTo = () => {
    setPageHistory(prev => [...prev, currentTab]);
  };

  const goBack = () => {
    if (pageHistory.length > 0) {
      const prevTab = pageHistory[pageHistory.length - 1];
      setPageHistory(prev => prev.slice(0, -1));
      setCurrentTab(prevTab as any);
    } else {
      setCurrentTab('home');
    }
  };

  return {
    // 播放器状态
    audioRef,
    currentSong,
    playlist,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    mode,
    lyrics,
    yrcLyrics,
    translateLyrics,
    currentLyricIndex,
    
    // 应用状态
    currentTab,
    pageHistory,
    banners,
    currentBanner,
    recommendPlaylists,
    highqualityPlaylists,
    playlistCategories,
    toplists,
    hotSearch,
    newSongs,
    newSongType,
    currentPlaylist,
    currentPlaylistSongs,
    currentArtist,
    searchKeyword,
    searchType,
    searchResults,
    playHistory,
    
    // 设置器
    setCurrentTab,
    setPageHistory,
    setBanners,
    setCurrentBanner,
    setRecommendPlaylists,
    setHighqualityPlaylists,
    setPlaylistCategories,
    setToplists,
    setHotSearch,
    setNewSongs,
    setNewSongType,
    setCurrentPlaylist,
    setCurrentPlaylistSongs,
    setCurrentArtist,
    setSearchKeyword,
    setSearchType,
    setSearchResults,
    setPlayHistory,
    setPlaylist,
    setCurrentIndex,
    
    // 方法
    playSong,
    playSongByIndex,
    togglePlay,
    playNext,
    playPrev,
    switchMode,
    seekTo,
    removeFromPlaylist,
    clearPlaylist,
    navigateTo,
    goBack,
    addToHistory,
    savePlaylist,
    loadPlaylist
  };
}
