declare var module: any;
import axios from "axios";

const HEADERS = {
  "User-Agent": "Mozilla/5.0",
  "Referer": "https://www.kugou.com/",
};

// 纯 JS Base64 解码，兼容 Node.js / Hermes
function decodeBase64(str: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  str = String(str).replace(/[^A-Za-z0-9+/=]/g, "");
  const bytes: number[] = [];
  let i = 0;
  while (i < str.length) {
    const e1 = chars.indexOf(str.charAt(i++));
    const e2 = chars.indexOf(str.charAt(i++));
    const e3 = chars.indexOf(str.charAt(i++));
    const e4 = chars.indexOf(str.charAt(i++));
    bytes.push((e1 << 2) | (e2 >> 4));
    if (e3 !== 64) bytes.push(((e2 & 15) << 4) | (e3 >> 2));
    if (e4 !== 64) bytes.push(((e3 & 3) << 6) | e4);
  }
  // UTF-8 解码
  let result = "";
  i = 0;
  while (i < bytes.length) {
    const b = bytes[i++];
    let codePoint: number;
    if (b < 0x80) {
      codePoint = b;
    } else if ((b >> 5) === 0x06) {
      codePoint = ((b & 0x1f) << 6) | (bytes[i++] & 0x3f);
    } else if ((b >> 4) === 0x0e) {
      codePoint = ((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
    } else {
      codePoint = ((b & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
    }
    result += String.fromCodePoint(codePoint);
  }
  return result;
}

async function search(query: string, page: number, type: string) {
  if (type !== "lyric") {
    return { isEnd: true, data: [] };
  }

  const res = (await axios.get("https://songsearch.kugou.com/song_search_v2", {
    params: { keyword: query, page: page || 1, pagesize: 10 },
    headers: HEADERS,
  })).data;

  const songs = res.data?.lists || [];
  const data = songs.map((song: any) => ({
    title: song.FileName,
    id: song.FileHash,
    artist: song.SingerName,
    album: song.AlbumName || "",
    albumId: song.AlbumID || "",
    hash: song.FileHash,
  }));

  return { isEnd: true, data };
}

async function getLyric(musicItem: any) {
  const lr = (await axios.get("https://lyrics.kugou.com/search", {
    params: { ver: 1, man: "yes", client: "pc", hash: musicItem.id, album_id: musicItem.albumId || "" },
    headers: HEADERS,
  })).data;

  const candidate = lr.candidates?.[0];
  if (!candidate) {
    return { rawLrc: "" };
  }

  const dl = (await axios.get("https://lyrics.kugou.com/download", {
    params: { ver: 1, client: "pc", id: candidate.id, accesskey: candidate.accesskey, fmt: "lrc", charset: "utf8" },
    headers: HEADERS,
  })).data;

  const lrc = decodeBase64(dl.content || "");

  return { rawLrc: lrc };
}

module.exports = {
  platform: "酷狗音乐",
  version: "1.0.0",
  srcUrl: "https://gitee.com/henyuer/myMusicfreePlugins/raw/master/dist/kugou/index.js",
  cacheControl: "no-store",
  supportedSearchType: ["lyric"],
  search,
  getLyric,
};
