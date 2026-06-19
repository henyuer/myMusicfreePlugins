const axios = require("axios");
const H = { "User-Agent": "Mozilla/5.0", "Referer": "https://www.kugou.com/" };

async function search(query) {
  console.log(`\n=== 酷狗搜索: "${query}" ===\n`);

  const r = (await axios.get("https://songsearch.kugou.com/song_search_v2", {
    params: { keyword: query, page: 1, pagesize: 5 },
    headers: H,
  })).data;

  const songs = r.data?.lists || [];
  const data = songs.map((s) => ({
    title: s.FileName,
    id: s.FileHash,
    artist: s.SingerName,
    album: s.AlbumName || "",
    albumId: s.AlbumID || "",
    hash: s.FileHash,
  }));

  data.forEach((item, i) => {
    console.log(`${i + 1}. ${item.title} — ${item.artist}`);
  });

  return { isEnd: true, data };
}

async function getLyric(musicItem) {
  console.log(`\n=== 获取歌词: ${musicItem.title} ===\n`);

  const lr = (await axios.get("https://lyrics.kugou.com/search", {
    params: { ver: 1, man: "yes", client: "pc", hash: musicItem.id, album_id: musicItem.albumId || "" },
    headers: H,
  })).data;

  const c = lr.candidates?.[0];
  if (!c) {
    console.log("无歌词");
    return { rawLrc: "" };
  }

  console.log(`匹配: ${c.singer} - ${c.song}`);

  const dl = (await axios.get("https://lyrics.kugou.com/download", {
    params: { ver: 1, client: "pc", id: c.id, accesskey: c.accesskey, fmt: "lrc", charset: "utf8" },
    headers: H,
  })).data;

  let lrc = dl.content || "";
  try {
    lrc = Buffer.from(lrc, "base64").toString("utf-8");
  } catch (e) {}

  console.log(lrc.slice(0, 400));
  return { rawLrc: lrc };
}

async function main() {
  const result = await search("周杰伦 手写的从前");

  if (result.data.length > 0) {
    await getLyric(result.data[0]);
  } else {
    console.log("\n未搜索到结果");
  }
}

main().catch((err) => {
  console.error("出错:", err.message);
});
