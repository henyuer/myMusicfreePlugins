import axios from "axios";

const HEADERS = {
  "User-Agent": "Mozilla/5.0",
  "Referer": "https://www.kugou.com/",
};

// 纯 JS Base64 解码，不依赖 Node Buffer
function decodeBase64(str: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let output = "";
  let i = 0;
  str = str.replace(/[^A-Za-z0-9+/=]/g, "");
  while (i < str.length) {
    const enc1 = chars.indexOf(str.charAt(i++));
    const enc2 = chars.indexOf(str.charAt(i++));
    const enc3 = chars.indexOf(str.charAt(i++));
    const enc4 = chars.indexOf(str.charAt(i++));
    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;
    output += String.fromCharCode(chr1);
    if (enc3 !== 64) output += String.fromCharCode(chr2);
    if (enc4 !== 64) output += String.fromCharCode(chr3);
  }
  return decodeURIComponent(escape(output));
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

export = {
  platform: "酷狗音乐",
  version: "1.0.0",
  srcUrl: "https://github.com/henyuer/myMusicfreePlugins/blob/master/dist/kugou/index.js",
  cacheControl: "no-store",
  supportedSearchType: ["lyric"],
  search,
  getLyric,
};
