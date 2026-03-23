import type { Song, Playlist, Banner, HotSearch, Toplist, Artist, Album } from '@/types/music';

const API_BASE = 'https://kekeke.cc.cd';

// API请求封装
export async function apiRequest(endpoint: string, params: Record<string, any> = {}) {
  const url = new URL(API_BASE + endpoint);
  
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, typeof value === 'string' ? value : String(value));
    }
  });
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('HTTP error! status: ' + response.status);
  }
  
  return response.json();
}

// 获取图片URL
export function getImageUrl(url: string, width = 200, height = 200): string {
  if (!url) return '';
  if (url.includes('?param=')) return url;
  return `${url}?param=${width}y${height}`;
}

// 格式化时间
export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// 格式化数字
export function formatNumber(num: number): string {
  if (!num || isNaN(num)) return '0';
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  return num.toString();
}

// HTML转义
export function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 获取Banner
export async function fetchBanners(): Promise<Banner[]> {
  const res = await apiRequest('/banner');
  return res.code === 200 && res.banners ? res.banners : [];
}

// 获取推荐歌单
export async function fetchRecommendPlaylists(limit = 6): Promise<Playlist[]> {
  const res = await apiRequest('/top/playlist/highquality', { limit });
  return res.code === 200 && res.playlists ? res.playlists : [];
}

// 获取排行榜
export async function fetchToplists(): Promise<Toplist[]> {
  const res = await apiRequest('/toplist');
  return res.code === 200 && res.list ? res.list.slice(0, 5) : [];
}

// 获取新歌速递
export async function fetchNewSongs(type = 0): Promise<Song[]> {
  const res = await apiRequest('/top/song', { type });
  return res.code === 200 && res.data ? res.data.slice(0, 10) : [];
}

// 获取热搜
export async function fetchHotSearch(): Promise<HotSearch[]> {
  const res = await apiRequest('/search/hot/detail');
  return res.code === 200 && res.data ? res.data.slice(0, 12) : [];
}

// 搜索
export async function search(keywords: string, type = 1, limit = 30) {
  const res = await apiRequest('/search', { keywords, type, limit });
  
  // 如果是歌曲搜索，批量获取详情以获取图片
  if (type === 1 && res.code === 200 && res.result?.songs) {
    const songs = res.result.songs;
    const ids = songs.map((s: Song) => s.id).join(',');
    try {
      const detailRes = await apiRequest('/song/detail', { ids });
      if (detailRes.code === 200 && detailRes.songs) {
        const songMap: Record<number, Song> = {};
        detailRes.songs.forEach((s: Song) => {
          songMap[s.id] = s;
        });
        songs.forEach((s: Song) => {
          const detail = songMap[s.id];
          if (detail?.al) {
            s.album = s.album || {};
            s.album.picUrl = detail.al.picUrl;
          }
        });
      }
    } catch (e) {
      console.error('获取歌曲详情失败:', e);
    }
  }
  
  return res;
}

// 获取歌单详情
export async function fetchPlaylistDetail(id: number): Promise<Playlist | null> {
  const res = await apiRequest('/playlist/detail', { id });
  return res.code === 200 && res.playlist ? res.playlist : null;
}

// 获取歌单歌曲
export async function fetchPlaylistSongs(id: number, limit = 100): Promise<Song[]> {
  const res = await apiRequest('/playlist/track/all', { id, limit });
  return res.code === 200 && res.songs ? res.songs : [];
}

// 获取歌手详情
export async function fetchArtistDetail(id: number): Promise<{ artist: Artist; hotSongs: Song[] } | null> {
  const res = await apiRequest('/artists', { id });
  return res.code === 200 ? { artist: res.artist, hotSongs: res.hotSongs || [] } : null;
}

// 获取歌手专辑
export async function fetchArtistAlbums(id: number, limit = 6): Promise<Album[]> {
  const res = await apiRequest('/artist/album', { id, limit });
  return res.code === 200 && res.hotAlbums ? res.hotAlbums : [];
}

// 获取歌曲URL
export async function fetchSongUrl(id: number): Promise<string | null> {
  const res = await apiRequest('/song/url', { id, br: 320000 });
  return res.code === 200 && res.data?.[0]?.url ? res.data[0].url : null;
}

// 检查歌曲可用性
export async function checkMusic(id: number): Promise<{ success: boolean; message?: string }> {
  const res = await apiRequest('/check/music', { id });
  return { success: res.success, message: res.message };
}

// 获取歌曲详情
export async function fetchSongDetail(id: number): Promise<Song | null> {
  const res = await apiRequest('/song/detail', { ids: id });
  return res.code === 200 && res.songs?.[0] ? res.songs[0] : null;
}

// 获取歌词
export async function fetchLyrics(id: number) {
  const res = await apiRequest('/lyric', { id });
  return res.code === 200 ? res : null;
}

// 获取歌单分类
export async function fetchPlaylistCategories(): Promise<{ name: string }[]> {
  const res = await apiRequest('/playlist/catlist');
  return res.code === 200 && res.sub ? res.sub.slice(0, 10) : [];
}

// 获取热门歌单
export async function fetchTopPlaylists(limit = 9): Promise<Playlist[]> {
  const res = await apiRequest('/top/playlist', { limit, order: 'hot' });
  return res.code === 200 && res.playlists ? res.playlists : [];
}
