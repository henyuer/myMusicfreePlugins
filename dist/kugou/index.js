"use strict";
const axios_1 = require("axios");
const HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Referer": "https://www.kugou.com/",
};
function decodeBase64(str) {
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
        if (enc3 !== 64)
            output += String.fromCharCode(chr2);
        if (enc4 !== 64)
            output += String.fromCharCode(chr3);
    }
    return decodeURIComponent(escape(output));
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
    srcUrl: "",
    cacheControl: "no-store",
    supportedSearchType: ["lyric"],
    search,
    getLyric,
};
