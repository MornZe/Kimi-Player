// 歌曲类型
export interface Song {
  id: number;
  name: string;
  artist: string;
  artists?: Artist[];
  ar?: Artist[];
  album?: Album;
  al?: Album;
  picUrl?: string;
  url?: string;
  duration?: number;
  dt?: number;
  playedAt?: number;
}

// 歌手类型
export interface Artist {
  id: number;
  name: string;
  picUrl?: string;
  alias?: string[];
}

// 专辑类型
export interface Album {
  id?: number;
  name?: string;
  picUrl?: string;
}

// 歌单类型
export interface Playlist {
  id: number;
  name: string;
  coverImgUrl?: string;
  playCount?: number;
  subscribedCount?: number;
  description?: string;
  creator?: {
    nickname: string;
  };
  trackCount?: number;
}

// Banner类型
export interface Banner {
  imageUrl: string;
  targetType: number;
  targetId: number;
}

// 歌词类型
export interface Lyric {
  time: number;
  text: string;
  duration?: number;
  words?: LyricWord[];
}

export interface LyricWord {
  text: string;
  startTime: number;
  duration: number;
}

// 热搜类型
export interface HotSearch {
  searchWord: string;
}

// 排行榜类型
export interface Toplist {
  id: number;
  name: string;
  coverImgUrl?: string;
  updateFrequency?: string;
}

// 播放器状态
export interface PlayerState {
  currentSong: Song | null;
  playlist: Song[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  mode: 'sequence' | 'random' | 'single';
  lyrics: Lyric[];
  yrcLyrics: Lyric[];
  translateLyrics: Lyric[];
  currentLyricIndex: number;
}

// 应用状态
export interface AppState {
  currentTab: 'home' | 'search' | 'playlist' | 'profile';
  pageHistory: string[];
  banners: Banner[];
  currentBanner: number;
  recommendPlaylists: Playlist[];
  highqualityPlaylists: Playlist[];
  playlistCategories: { name: string }[];
  toplists: Toplist[];
  hotSearch: HotSearch[];
  newSongs: Song[];
  newSongType: number;
  currentPlaylist: Playlist | null;
  currentPlaylistSongs: Song[];
  currentArtist: Artist | null;
  searchKeyword: string;
  searchType: number;
  searchResults: Record<number, any>;
  playHistory: Song[];
}
