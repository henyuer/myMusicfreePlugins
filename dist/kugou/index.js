"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Referer": "https://www.kugou.com/",
};
function decodeBase64(str) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    str = String(str).replace(/[^A-Za-z0-9+/=]/g, "");
    const bytes = [];
    let i = 0;
    while (i < str.length) {
        const e1 = chars.indexOf(str.charAt(i++));
        const e2 = chars.indexOf(str.charAt(i++));
        const e3 = chars.indexOf(str.charAt(i++));
        const e4 = chars.indexOf(str.charAt(i++));
        bytes.push((e1 << 2) | (e2 >> 4));
        if (e3 !== 64)
            bytes.push(((e2 & 15) << 4) | (e3 >> 2));
        if (e4 !== 64)
            bytes.push(((e3 & 3) << 6) | e4);
    }
    let result = "";
    i = 0;
    while (i < bytes.length) {
        const b = bytes[i++];
        let codePoint;
        if (b < 0x80) {
            codePoint = b;
        }
        else if ((b >> 5) === 0x06) {
            codePoint = ((b & 0x1f) << 6) | (bytes[i++] & 0x3f);
        }
        else if ((b >> 4) === 0x0e) {
            codePoint = ((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
        }
        else {
            codePoint = ((b & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
        }
        result += String.fromCodePoint(codePoint);
    }
    return result;
}
async function search(query, page, type) {
    var _a;
    if (type !== "lyric") {
        return { isEnd: true, data: [] };
    }
    const res = (await axios_1.default.get("https://songsearch.kugou.com/song_search_v2", {
        params: { keyword: query, page: page || 1, pagesize: 10 },
        headers: HEADERS,
    })).data;
    const songs = ((_a = res.data) === null || _a === void 0 ? void 0 : _a.lists) || [];
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
    var _a;
    const lr = (await axios_1.default.get("https://lyrics.kugou.com/search", {
        params: { ver: 1, man: "yes", client: "pc", hash: musicItem.id, album_id: musicItem.albumId || "" },
        headers: HEADERS,
    })).data;
    const candidate = (_a = lr.candidates) === null || _a === void 0 ? void 0 : _a[0];
    if (!candidate) {
        return { rawLrc: "" };
    }
    const dl = (await axios_1.default.get("https://lyrics.kugou.com/download", {
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
