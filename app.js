const config = {
  channels: ["频道订阅榜","频道","订阅数","subscribers"],
  videos: ["音乐视频累计播放榜","视频","累计播放","views"],
  daily: ["音乐视频近 24 小时播放榜","视频","24 小时新增","dailyViews"]
};
const el = id => document.getElementById(id);
let active, records;
function child(parent, tag, value, cls) {
  const node = document.createElement(tag);
  node.textContent = value || "";
  if (cls) node.className = cls;
  parent.append(node);
  return node;
}
function chineseCount(raw, daily) {
  const match = String(raw).trim().match(/^(\d+(?:,\d{3})*(?:\.\d+)?)\s*([KMB]?)$/i);
  if (!match) return null;
  const multipliers = { "": 1, K: 1e3, M: 1e6, B: 1e9 };
  const count = Number(match[1].replaceAll(",", "")) * multipliers[match[2].toUpperCase()];
  const unit = count >= 1e8 ? "亿" : count >= 1e4 ? "万" : "";
  const scaled = count / ({ "亿": 1e8, "万": 1e4, "": 1 }[unit]);
  const number = scaled.toFixed(unit ? 2 : 0).replace(/\.00$/, "");
  return (daily ? "+" : "") + number + (unit ? " " + unit : "");
}
function render() {
  if (!records) return;
  const query = el("search").value.trim().toLowerCase();
  const rows = el("rows");
  rows.replaceChildren();
  for (const r of records) {
    const original = r.name || r.title;
    const zh = r.nameZh || r.titleZh;
    const details = [r.channelZh || r.channel, r.countryZh, r.categoryZh, r.languageZh].filter(Boolean);
    if (![original, zh, r.channel, ...details].join(" ").toLowerCase().includes(query)) continue;
    const row = child(rows,"div","","row");
    child(row,"span",String(r.rank).padStart(2,"0"),"rank");
    const item = child(row,"div","","entry");
    const frame = child(item,"div","","thumb " + (active === "channels" ? "avatar" : "cover"));
    frame.textContent = (original || "").slice(0,1);
    frame.setAttribute("aria-hidden","true");
    if (r.thumbnail && /^data\/thumbnails\/[a-zA-Z0-9_-]+\.jpg$/.test(r.thumbnail)) {
      const img = document.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      img.onerror = () => img.remove();
      img.src = "./" + r.thumbnail;
      frame.append(img);
    }
    const cell = child(item,"div","","caption");
    const link = child(cell,"a",original,"name");
    if (/^https:\/\/(www\.)?youtube\.com\//i.test(r.url)) {
      link.href = r.url; link.target = "_blank"; link.rel = "noopener noreferrer";
    }
    if (zh && zh !== original) child(cell,"small",zh);
    child(cell,"small",details.join(" · "));
    const raw = r[config[active][3]];
    const count = child(row,"div","","count");
    const formatted = chineseCount(raw, active === "daily");
    child(count,"strong",formatted ?? String(raw ?? "—"));
    if (formatted !== null) child(count,"small",String(raw));
  }
  el("status").textContent = rows.children.length ? `显示 ${rows.children.length} / ${records.length} 条记录` : "没有匹配的记录";
}
async function selectBoard(key) {
  active = key; records = null; el("updated").textContent = "";
  const [heading,label,metric] = config[key];
  el("heading").textContent = heading; el("itemLabel").textContent = label; el("metric").textContent = metric;
  for (const b of document.querySelectorAll("[data-board]")) b.setAttribute("aria-pressed",b.dataset.board === key);
  el("rows").replaceChildren(); el("search").value = ""; el("status").textContent = "正在读取榜单…";
  try {
    const res = await fetch("./data/youtube_top50_"+key+".json");
    if (!res.ok) throw Error();
    const data = await res.json();
    if (active !== key) return;
    const timestamp = new Date(data[0]?.updatedAt || "");
    if (Number.isFinite(timestamp.getTime())) {
      const formatted = new Intl.DateTimeFormat("zh-CN", {
        timeZone:"Asia/Shanghai", year:"numeric", month:"2-digit", day:"2-digit",
        hour:"2-digit", minute:"2-digit", hourCycle:"h23"
      }).format(timestamp);
      el("updated").textContent = "最近更新（北京时间） " + formatted;
    }
    records = data; render();
  } catch { if (active === key) el("status").textContent = "读取失败，请刷新页面重试。"; }
}
document.querySelector("nav").onclick = e => { if (e.target.dataset.board) selectBoard(e.target.dataset.board); };
el("search").oninput = render;
selectBoard("channels");
