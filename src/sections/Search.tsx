import { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, X, MoreHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as api from '@/services/api';
import type { Song, Artist, Playlist, Album } from '@/types/music';

interface SearchProps {
  onSongClick: (id: number) => void;
  onPlaylistClick: (id: number) => void;
  onArtistClick: (id: number) => void;
}

export function Search({ onSongClick, onPlaylistClick, onArtistClick }: SearchProps) {
  const [keyword, setKeyword] = useState('');
  const [hotSearch, setHotSearch] = useState<{ searchWord: string }[]>([]);
  const [searchType, setSearchType] = useState(1);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 加载热搜
  useEffect(() => {
    const loadHotSearch = async () => {
      try {
        const res = await api.fetchHotSearch();
        setHotSearch(res);
      } catch (error) {
        console.error('加载热搜失败:', error);
      }
    };
    loadHotSearch();
  }, []);

  // 执行搜索
  const performSearch = useCallback(async (searchKeyword: string, type: number) => {
    if (!searchKeyword.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    setKeyword(searchKeyword);
    setSearchType(type);
    
    try {
      const res = await api.search(searchKeyword.trim(), type, 30);
      setSearchResults(res);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 处理输入
  const handleInputChange = (value: string) => {
    setKeyword(value);
    if (!value) {
      setHasSearched(false);
      setSearchResults(null);
    }
  };

  // 清空搜索
  const clearSearch = () => {
    setKeyword('');
    setHasSearched(false);
    setSearchResults(null);
  };

  // 处理回车
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && keyword.trim()) {
      performSearch(keyword, searchType);
    }
  };

  // 切换搜索类型
  const handleTypeChange = (type: string) => {
    const numType = parseInt(type);
    setSearchType(numType);
    if (keyword.trim()) {
      performSearch(keyword, numType);
    }
  };

  return (
    <div className="pb-20">
      {/* 搜索头部 */}
      <div className="sticky top-0 z-10 bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={keyword}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索歌曲、歌手、专辑"
            className="pl-11 pr-10 py-3 h-12 bg-gray-100 border-0 rounded-full text-sm focus-visible:ring-red-200 focus-visible:ring-2"
          />
          {keyword && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center"
              onClick={clearSearch}
            >
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* 默认显示热搜 */}
      {!hasSearched && (
        <div className="px-4 py-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">热搜榜</h3>
          <div className="flex flex-wrap gap-2.5">
            {hotSearch.map((item, index) => (
              <button
                key={index}
                className={`px-4 py-2.5 rounded-full text-xs font-medium transition-all border ${
                  index < 3
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-white text-gray-700 border-gray-100 hover:bg-gray-50'
                }`}
                onClick={() => performSearch(item.searchWord, 1)}
              >
                {index < 3 ? `${index + 1}. ` : ''}{item.searchWord}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      {hasSearched && (
        <div className="px-4 py-4">
          {/* 搜索类型标签 */}
          <Tabs value={searchType.toString()} onValueChange={handleTypeChange} className="mb-4">
            <TabsList className="w-full bg-transparent border-b border-gray-100 rounded-none h-auto p-0">
              {[
                { value: '1', label: '单曲' },
                { value: '100', label: '歌手' },
                { value: '10', label: '专辑' },
                { value: '1000', label: '歌单' }
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:text-red-600 data-[state=active]:shadow-none py-3 text-sm font-medium text-gray-500"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* 搜索结果内容 */}
          {loading ? (
            <div className="space-y-3">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="w-11 h-11 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <SearchResults 
              type={searchType}
              data={searchResults}
              onSongClick={onSongClick}
              onPlaylistClick={onPlaylistClick}
              onArtistClick={onArtistClick}
            />
          )}
        </div>
      )}
    </div>
  );
}

// 搜索结果组件
function SearchResults({ 
  type, 
  data, 
  onSongClick, 
  onPlaylistClick, 
  onArtistClick 
}: { 
  type: number; 
  data: any;
  onSongClick: (id: number) => void;
  onPlaylistClick: (id: number) => void;
  onArtistClick: (id: number) => void;
}) {
  if (!data || data.code !== 200) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-sm">搜索失败</p>
      </div>
    );
  }

  // 单曲搜索
  if (type === 1) {
    const songs = data.result?.songs || [];
    if (songs.length === 0) {
      return <EmptyState text="暂无相关歌曲" />;
    }
    
    return (
      <div className="space-y-1">
        {songs.map((song: Song, index: number) => (
          <SearchSongItem 
            key={song.id}
            song={song}
            index={index + 1}
            onClick={() => onSongClick(song.id)}
          />
        ))}
      </div>
    );
  }

  // 歌手搜索
  if (type === 100) {
    const artists = data.result?.artists || [];
    if (artists.length === 0) {
      return <EmptyState text="暂无相关歌手" />;
    }
    
    return (
      <div className="grid grid-cols-4 gap-4">
        {artists.map((artist: Artist) => (
          <div 
            key={artist.id}
            className="text-center cursor-pointer"
            onClick={() => onArtistClick(artist.id)}
          >
            <div className="aspect-square rounded-full overflow-hidden mb-2 bg-gray-100 shadow-sm">
              <img 
                src={api.getImageUrl(artist.picUrl || '', 150, 150)}
                alt={artist.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <p className="text-xs font-medium text-gray-800 truncate">{artist.name}</p>
          </div>
        ))}
      </div>
    );
  }

  // 专辑搜索
  if (type === 10) {
    const albums = data.result?.albums || [];
    if (albums.length === 0) {
      return <EmptyState text="暂无相关专辑" />;
    }
    
    return (
      <div className="grid grid-cols-4 gap-4">
        {albums.map((album: Album) => (
          <div 
            key={album.id}
            className="text-center cursor-pointer"
            onClick={() => onSongClick(album.id || 0)}
          >
            <div className="aspect-square rounded-xl overflow-hidden mb-2 bg-gray-100 shadow-sm">
              <img 
                src={api.getImageUrl(album.picUrl || '', 150, 150)}
                alt={album.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <p className="text-xs font-medium text-gray-800 truncate">{album.name}</p>
          </div>
        ))}
      </div>
    );
  }

  // 歌单搜索
  if (type === 1000) {
    const playlists = data.result?.playlists || [];
    if (playlists.length === 0) {
      return <EmptyState text="暂无相关歌单" />;
    }
    
    return (
      <div className="grid grid-cols-3 gap-3">
        {playlists.map((playlist: Playlist) => (
          <div 
            key={playlist.id}
            className="cursor-pointer"
            onClick={() => onPlaylistClick(playlist.id)}
          >
            <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-gray-100 shadow-sm">
              <img 
                src={api.getImageUrl(playlist.coverImgUrl || '', 200, 200)}
                alt={playlist.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-white/80" />
                {api.formatNumber(playlist.playCount || 0)}
              </div>
            </div>
            <p className="text-xs font-medium text-gray-800 line-clamp-2">{playlist.name}</p>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// 搜索歌曲项
function SearchSongItem({ song, index, onClick }: { song: Song; index: number; onClick: () => void }) {
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
      <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400">
        <MoreHorizontal className="w-5 h-5" />
      </Button>
    </div>
  );
}

// 空状态
function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <p className="text-sm">{text}</p>
    </div>
  );
}
