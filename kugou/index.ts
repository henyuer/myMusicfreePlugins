import axios from "axios";

const HEADERS = {
  "User-Agent": "Mozilla/5.0",
  "Referer": "https://www.kugou.com/",
};

async function search(query, page, type) {
  if (type !== "lyric") {
    return { isEnd: true, data: [] };
  }

  const res = (await axios.get("https://songsearch.kugou.com/song_search_v2", {
    params: { keyword: query, page: page || 1, pagesize: 10 },
    headers: HEADERS,
  })).data;

  const songs = res.data?.lists || [];
  const data = songs.map((song) => ({
    title: song.FileName,
    id: song.FileHash,
    artist: song.SingerName,
    album: song.AlbumName || "",
    albumId: song.AlbumID || "",
    hash: song.FileHash,
  }));

  return { isEnd: true, data };
}

async function getLyric(musicItem) {
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

  let lrc = dl.content || "";
  try {
    lrc = Buffer.from(lrc, "base64").toString("utf-8");
  } catch (_) {
    // 非 Base64，原样返回
  }

  return { rawLrc: lrc };
}

module.exports = {
  platform: "酷狗音乐",
  version: "1.0.0",
  srcUrl: "https://gitee.com/maotoumao/MusicFreePlugins/raw/v0.1/dist/kugou/index.js",
  cacheControl: "no-store",
  supportedSearchType: ["lyric"],
  search,
  getLyric,
};
