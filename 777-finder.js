// ================= IMPORT =================
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const { fetch, Agent } = require("undici");

// ✅ Keep-alive agent biar fetch lebih irit & responsif
const httpAgent = new Agent({
  connections: 20,          // max concurrent sockets
  pipelining: 1,            // aman buat endpoint ini
  keepAliveTimeout: 60_000,
  keepAliveMaxTimeout: 60_000,
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const TOKEN = process.env.TOKEN;
const PREFIX = "!";

// ================= SERVER DATA =================
// ⚠️ PASTE LIST SERVER 40 LU DI SINI (yang panjang itu)
const serverData = [
  { name: "Indopride Roleplay", alias: "idp", cfx: "bak4pl" },
  { name: "Nagara", alias: "nagara", cfx: "d7vrzd" },
  { name: "Nusa V", alias: "nusav", cfx: "ele3bm" },
  { name: "Amora State Indonesia", alias: "amora", cfx: "lk6x85" },
  { name: "Victoria", alias: "vic", cfx: "3qjvrz" },
  { name: "Ime Roleplay", alias: "imerp", cfx: "zrvmg4" },
  { name: "Town Glorix Roleplay", alias: "glorix", cfx: "bjyd8b" },
  { name: "Cerita Kita Roleplay", alias: "cerita", cfx: "zxmea5" },
  { name: "Executive RP", alias: "exe", cfx: "roek67" },
  { name: "Cerita Roleplayku Indo", alias: "ceritaku", cfx: "pmj7by" },
  { name: "Kotabaru Roleplay", alias: "kotabaru", cfx: "mez5p7" },
  { name: "Last Paradise RP Indo", alias: "last", cfx: "8rvzg5" },
  { name: "Solova Roleplay", alias: "solova", cfx: "8rvzg5" },
  { name: "Bersama Kita Roleplay", alias: "bersama", cfx: "g6aylq" },
  { name: "Dunia Roleplay", alias: "dunia", cfx: "kr3glr" },
  { name: "Kingdom Roleplay Indo", alias: "kingdom", cfx: "7g6vzb" },
  { name: "Savana Roleplay", alias: "savana", cfx: "3vgq5o" },
  { name: "Noctis indonesia", alias: "noc", cfx: "8r5lp3" },
  { name: "Impian Kita V2", alias: "impian", cfx: "drjjpj" },
  { name: "Kota indah indonesia", alias: "indah", cfx: "o47de7" },
  { name: "Mercy Roleplay", alias: "mercy", cfx: "xj9l5r" },
  { name: "Gempita Roleplay Indo", alias: "gempita", cfx: "gmgx7q" },
  { name: "Signature Roleplay Indo", alias: "signature", cfx: "q9d84p" },
  { name: "Nuansa Roleplay Indo", alias: "nuansa", cfx: "bjjob4" },
  { name: "DayDream Roleplay", alias: "daydream", cfx: "4zqglv" },
  { name: "Sentra Nusantara RP", alias: "sentra", cfx: "vagdok" },
  { name: "Kota bagus nusantara RP", alias: "bagus", cfx: "3eqozy" },
  { name: "Our Glory roleplay", alias: "our", cfx: "55k88a" },
  { name: "Senjakala roleplay", alias: "senja", cfx: "z5oaqp" },
  { name: "Hexos Rp", alias: "hexos", cfx: "rmz57j" },
  { name: "Origami Roleplay", alias: "origami", cfx: "plj9dy" },
  { name: "indostars Roleplay Indo", alias: "indostars", cfx: "mxzeev" },
  { name: "Chronicle Roleplay Indo", alias: "chronicle", cfx: "bammal" },
  { name: "Kotakita Roleplay", alias: "kotakita", cfx: "r35px8" },
  { name: "Satu Mimpi", alias: "satumimpi", cfx: "3e3gdb" },
  { name: "Jing Arena Indonesia", alias: "jing", cfx: "53k9ra" },
  { name: "Senpai arena", alias: "senpai", cfx: "3mg36b" },
  { name: "caur ffa", alias: "caur", cfx: "vx7685" },
  { name: "Coffe shop 45", alias: "coffee", cfx: "javo7a" },
  { name: "Paleto Raceway", alias: "balap", cfx: "adla85" },
];

// ================= UTILS =================
const normalize = (str) =>
  (str || "")
    .replace(/\^./g, "")
    .toLowerCase()
    .replace(/[_\-.,/\\|]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const parseQueryTokens = (raw) => {
  const s = (raw || "").trim();
  if (!s) return [];
  const tokens = [];
  const re = /"([^"]+)"|(\S+)/g; // support quotes
  let m;
  while ((m = re.exec(s)) !== null) {
    const t = normalize(m[1] || m[2]);
    if (t) tokens.push(t);
  }
  return tokens;
};

const nameToTokens = (name) => {
  const n = normalize(name);
  if (!n) return [];
  return n.split(" ").filter(Boolean);
};

const matchesAllTokens = (playerName, queryTokens) => {
  if (queryTokens.length === 0) return true;
  const tokens = nameToTokens(playerName);
  if (tokens.length === 0) return false;
  return queryTokens.every((q) => tokens.includes(q));
};

function resolveTargetId(input) {
  const found = serverData.find((s) => s.alias === input.toLowerCase());
  if (input.includes("cfx.re/join/")) return input.split("join/")[1];
  return found ? found.cfx : input;
}

// --- fetch timeout helper (biar loop nggak nyangkut lama) ---
async function fetchWithTimeout(url, options = {}, timeoutMs = 6500) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      dispatcher: httpAgent, // ✅ keep-alive pooling
    });
  } finally {
    clearTimeout(t);
  }
}

async function fetchServer(targetId) {
  const res = await fetchWithTimeout(
    `https://servers-frontend.fivem.net/api/servers/single/${targetId}`,
    { headers: { "User-Agent": "Mozilla/5.0" } },
    6500
  );
  if (!res.ok) throw new Error("fetch failed");
  const json = await res.json();
  return json.Data;
}

function cleanHostname(hostname) {
  return (hostname || "UNKNOWN SERVER").replace(/\^./g, "").trim().toUpperCase();
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour12: false });
}

// ✅ Map-limit tanpa dependency biar !server gak ngegas 40 request barengan
async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let idx = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = idx++;
      if (i >= items.length) break;
      results[i] = await mapper(items[i], i);
    }
  });

  await Promise.all(workers);
  return results;
}

// ================= WATCH SYSTEM =================
const watchSessions = new Map(); // msgId -> session

const WATCH_INTERVAL = 5000; // 5 detik
const WATCH_ITEMS = 20;

// ✅ UI / LOG SETTINGS
const LOG_MAX = 12; // max baris log tampil
const LEFT_THRESHOLD = 3; // anti kedip (3x miss) => ~15 detik

// ✅ Shared poller per targetId biar gak fetch berkali-kali kalau watchnya banyak
const targetPollers = new Map(); // targetId -> { timer, inFlight, sessions:Set<msgId> }

function ensureTargetPoller(targetId) {
  if (targetPollers.has(targetId)) return targetPollers.get(targetId);

  const poller = {
    timer: null,
    inFlight: false,
    sessions: new Set(),
  };

  async function tick() {
    poller.timer = null; // clear "scheduled" flag

    if (poller.inFlight) {
      scheduleNext();
      return;
    }
    if (poller.sessions.size === 0) return;

    poller.inFlight = true;
    try {
      const data = await fetchServer(targetId);
      const players = data.players || [];

      // update semua session yang nonton targetId ini
      for (const msgId of poller.sessions) {
        const session = watchSessions.get(msgId);
        if (!session || !session.watchOn) continue;

        const filtered = players.filter((p) => matchesAllTokens(p.name || "", session.tokens));

        const currentMap = new Map(filtered.map((p) => [String(p.id), p.name || "UNKNOWN"]));
        const beforeMap = session.previousMap || new Map();

        // update last known name + reset miss
        for (const [id, name] of currentMap.entries()) {
          session.lastKnownName.set(id, name);
          session.missCount.delete(id);
        }

        // JOIN
        const joined = [];
        for (const [id, name] of currentMap.entries()) {
          if (!beforeMap.has(id)) joined.push({ id, name });
        }

        // LEFT debounce
        const left = [];
        for (const [id] of beforeMap.entries()) {
          if (currentMap.has(id)) continue;

          const m = (session.missCount.get(id) || 0) + 1;
          session.missCount.set(id, m);

          if (m >= LEFT_THRESHOLD) {
            const name = session.lastKnownName.get(id) || "UNKNOWN";
            left.push({ id, name });
            session.missCount.delete(id);
          }
        }

        // update snapshot + meta
        session.previousMap = currentMap;
        session.filtered = filtered;
        session.totalClients = data.clients || filtered.length;
        session.title = cleanHostname(data.hostname);
        session.totalPages = Math.max(1, Math.ceil(filtered.length / WATCH_ITEMS));
        if (session.page >= session.totalPages) session.page = session.totalPages - 1;

        // log masuk embed (bukan spam chat)
        const t = nowTime();
        for (const p of joined) session.logs.push(`🟢 + (${p.id}) ${p.name} — ${t}`);
        for (const p of left) session.logs.push(`🔴 - (${p.id}) ${p.name} — ${t}`);
        if (session.logs.length > 200) session.logs = session.logs.slice(-200);

        // ✅ Kalau gak ada perubahan join/left & list count sama & page tetap, skip edit (lebih responsif)
        const changed = joined.length > 0 || left.length > 0;
        const countChanged = session._lastCount !== filtered.length;
        const titleChanged = session._lastTitle !== session.title;

        if (!changed && !countChanged && !titleChanged) continue;

        session._lastCount = filtered.length;
        session._lastTitle = session.title;

        // ambil panel message
        const panelMsg = session.panelMessage
          ? session.panelMessage
          : await client.channels
              .fetch(session.channelId)
              .then((ch) => (ch?.isTextBased() ? ch.messages.fetch(session.messageId) : null))
              .catch(() => null);

        if (!panelMsg) continue;
        session.panelMessage = panelMsg;

        const embed = buildListEmbed({
          title: session.title,
          queryLabel: session.queryLabel,
          filtered: session.filtered,
          totalClients: session.totalClients,
          page: session.page,
          totalPages: session.totalPages,
          logs: session.logs,
        });

        const row = buildWatchRow(session);
        await panelMsg.edit({ embeds: [embed], components: [row] }).catch(() => null);
      }
    } catch {
      // no spam
    } finally {
      poller.inFlight = false;
      scheduleNext();
    }
  }

  function scheduleNext() {
    if (poller.sessions.size === 0) return;
    if (poller.timer) return;
    poller.timer = setTimeout(tick, WATCH_INTERVAL); // ✅ setTimeout chain (lebih stabil)
  }

  poller.start = () => scheduleNext();
  poller.stopIfIdle = () => {
    if (poller.sessions.size === 0 && poller.timer) {
      clearTimeout(poller.timer);
      poller.timer = null;
    }
  };

  targetPollers.set(targetId, poller);
  return poller;
}

// Build embed for watch/find list + Activity Log
function buildListEmbed({
  title,
  queryLabel,
  filtered,
  totalClients,
  page,
  totalPages,
  logs = [],
  clearHint = true,
}) {
  const list = filtered
    .slice(page * WATCH_ITEMS, (page + 1) * WATCH_ITEMS)
    .map((pl, i) => {
      const idx = (page * WATCH_ITEMS + i + 1).toString().padStart(2, " ");
      const id = (pl.id ?? "").toString().padEnd(4, " ");
      const nm = (pl.name || "").slice(0, 35);
      return `${idx}. (${id}) ${nm}`;
    })
    .join("\n");

  const logText = logs.length ? logs.slice(-LOG_MAX).join("\n") : "Belum ada aktivitas.";

  return new EmbedBuilder()
    .setColor("#1ABC9C")
    .setTitle(`🎮 ${title.slice(0, 80)}`)
    .setDescription(
      `**Query:** \`${queryLabel}\`\n` +
        `**Ditemukan:** **${filtered.length}** player\n` +
        `\`\`\`\n${list || "Tidak ada player."}\n\`\`\`\n` +
        `**Total:** ${filtered.length}/${totalClients} players\n\n` +
        `**Activity Log${clearHint ? " (auto-clear saat REFRESH)" : ""}:**\n` +
        `\`\`\`\n${logText}\n\`\`\``
    )
    .setFooter({ text: `Page ${page + 1}/${totalPages || 1}` })
    .setTimestamp();
}

function buildWatchRow(session) {
  const prevDisabled = session.page === 0;
  const nextDisabled = session.page >= session.totalPages - 1;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`watch_prev:${session.messageId}`)
      .setLabel("PREV")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(prevDisabled),
    new ButtonBuilder()
      .setCustomId(`watch_next:${session.messageId}`)
      .setLabel("NEXT")
      .setStyle(ButtonStyle.Success)
      .setDisabled(nextDisabled),
    new ButtonBuilder()
      .setCustomId(`watch_refresh:${session.messageId}`)
      .setLabel("REFRESH")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`watch_toggle:${session.messageId}`)
      .setLabel(session.watchOn ? "WATCH: ON" : "WATCH: OFF")
      .setStyle(session.watchOn ? ButtonStyle.Danger : ButtonStyle.Secondary)
  );
}

async function refreshWatch(session, messageToEdit) {
  const data = await fetchServer(session.targetId);
  const players = data.players || [];
  const filtered = players.filter((p) => matchesAllTokens(p.name || "", session.tokens));

  session.filtered = filtered;
  session.title = cleanHostname(data.hostname);
  session.totalClients = data.clients || filtered.length;
  session.totalPages = Math.max(1, Math.ceil(filtered.length / WATCH_ITEMS));

  if (session.page >= session.totalPages) session.page = session.totalPages - 1;
  if (session.page < 0) session.page = 0;

  // ✅ cache last meta for "skip edit" logic
  session._lastCount = filtered.length;
  session._lastTitle = session.title;

  const embed = buildListEmbed({
    title: session.title,
    queryLabel: session.queryLabel,
    filtered: session.filtered,
    totalClients: session.totalClients,
    page: session.page,
    totalPages: session.totalPages,
    logs: session.logs || [],
  });

  const row = buildWatchRow(session);
  await messageToEdit.edit({ embeds: [embed], components: [row] });

  return filtered;
}

function startWatchLoop(session) {
  const poller = ensureTargetPoller(session.targetId);
  poller.sessions.add(session.messageId);
  poller.start();
}

function stopWatchLoop(session) {
  const poller = ensureTargetPoller(session.targetId);
  poller.sessions.delete(session.messageId);
  poller.stopIfIdle();
}

// ================= READY =================
client.on("ready", () => console.log(`🚀 Connected as ${client.user.tag}`));

// ================= COMMAND HANDLER =================
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = (args.shift() || "").toLowerCase();

  // ===== SERVER (STYLE LAMA, tapi optimized) =====
  if (command === "server") {
    const loadingMsg = await message.reply("`🔄 Fetching real-time leaderboard data...`");
    try {
      // ✅ limit concurrency biar gak ngelag
      const CONCURRENCY = 6;

      const results = await mapLimit(serverData, CONCURRENCY, async (s) => {
        try {
          const data = await fetchServer(s.cfx);
          return { ...s, players: data?.clients || 0, status: true };
        } catch {
          return { ...s, players: 0, status: false };
        }
      });

      results.sort((a, b) => b.players - a.players);

      const formatLine = (s, i) => {
        const st = s.status ? "✅" : "❌";
        const no = (i + 1).toString().padEnd(2, " ");
        const name = s.name.toUpperCase().slice(0, 20).padEnd(20, " ");
        const plys = `[${s.players.toString().padStart(4, " ")}]`.padEnd(6, " ");
        return `${st} ${no} ${name} ${plys} ${s.alias}`;
      };

      const embed = new EmbedBuilder()
        .setColor("#F1C40F")
        .setTitle("🏆 FiveM Cfx Finder")
        .setDescription(
          `\`\`\`\nTotal Server: ${serverData.length} Monitored\nSorted By: Player Count\n\`\`\`\n` +
            `\`\`\`\nSt No Nama Server           Plys   Alias\n── ── ──────────────────── ────── ─────────\n` +
            `${results.slice(0, 14).map((s, i) => formatLine(s, i)).join("\n")}\n\`\`\`` +
            `\`\`\`\n${results.slice(14, 28).map((s, i) => formatLine(s, i + 14)).join("\n")}\n\`\`\`` +
            `\`\`\`\n${results.slice(28, 40).map((s, i) => formatLine(s, i + 28)).join("\n")}\n\`\`\``
        )
        .setFooter({ text: `777 PROJECT || ${new Date().toLocaleTimeString()}` });

      await loadingMsg.edit({ content: null, embeds: [embed] });
    } catch {
      loadingMsg.edit("`❌ Gagal mengambil data leaderboard.`");
    }
  }

  // ===== FIND (TETEP) =====
  if (command === "find") {
    const input = args[0];
    if (!input) return message.reply("Gunakan `!find <alias>`."); 

    const query = args.slice(1).join(" ");
    const tokens = parseQueryTokens(query);
    const targetId = resolveTargetId(input);

    try {
      const loading = await message.reply("`Syncing data...`");
      const data = await fetchServer(targetId);

      const players = data.players || [];
      const filtered = players.filter((p) => matchesAllTokens(p.name || "", tokens));

      let page = 0;
      const totalPages = Math.max(1, Math.ceil(filtered.length / WATCH_ITEMS));
      const title = cleanHostname(data.hostname);
      const queryLabel = query || "semua";
      const totalClients = data.clients || filtered.length;

      const makeEmbed = (p) =>
        buildListEmbed({
          title,
          queryLabel,
          filtered,
          totalClients,
          page: p,
          totalPages,
          logs: [], // FIND ga butuh log
          clearHint: false,
        });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("find_prev")
          .setLabel("PREV")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("find_next")
          .setLabel("NEXT")
          .setStyle(ButtonStyle.Success)
          .setDisabled(totalPages <= 1)
      );

      const msg = await loading.edit({
        content: null,
        embeds: [makeEmbed(0)],
        components: [row],
      });

      const col = msg.createMessageComponentCollector({ time: 300000 });
      col.on("collect", async (i) => {
        if (i.user.id !== message.author.id)
          return i.reply({ content: "Unauthorized", ephemeral: true });

        if (i.customId === "find_prev") page--;
        else page++;

        if (page < 0) page = 0;
        if (page >= totalPages) page = totalPages - 1;

        const newRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("find_prev")
            .setLabel("PREV")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId("find_next")
            .setLabel("NEXT")
            .setStyle(ButtonStyle.Success)
            .setDisabled(page === totalPages - 1)
        );

        await i.update({ embeds: [makeEmbed(page)], components: [newRow] });
      });
    } catch {
      message.reply("`❌ API Timeout atau Server Tidak Ditemukan.`");
    }
  }

  // ===== WATCH (LIST + PAGING + REFRESH + TRACK) =====
  if (command === "watch") {
    const input = args[0];
    if (!input) return message.reply("Gunakan `!watch <alias> <query>`."); 

    const query = args.slice(1).join(" ");
    const tokens = parseQueryTokens(query);
    const targetId = resolveTargetId(input);
    const queryLabel = query || "semua";

    try {
      const loading = await message.reply("`Creating watch panel...`");
      const data = await fetchServer(targetId);

      const players = data.players || [];
      const filtered = players.filter((p) => matchesAllTokens(p.name || "", tokens));

      const session = {
        messageId: null,
        authorId: message.author.id,
        channelId: message.channel.id,

        inputAlias: input,
        targetId,

        tokens,
        queryLabel,

        title: cleanHostname(data.hostname),
        totalClients: data.clients || filtered.length,

        filtered,
        page: 0,
        totalPages: Math.max(1, Math.ceil(filtered.length / WATCH_ITEMS)),

        watchOn: false,

        // ✅ panel edit target
        panelMessage: null,

        // ✅ logs di embed (anti spam)
        logs: [],

        // ✅ snapshot + anti kedip
        previousMap: new Map(filtered.map((p) => [String(p.id), p.name || "UNKNOWN"])),
        missCount: new Map(),
        lastKnownName: new Map(filtered.map((p) => [String(p.id), p.name || "UNKNOWN"])),

        // ✅ for skip edit
        _lastCount: filtered.length,
        _lastTitle: cleanHostname(data.hostname),
      };

      const embed = buildListEmbed({
        title: session.title,
        queryLabel: session.queryLabel,
        filtered: session.filtered,
        totalClients: session.totalClients,
        page: session.page,
        totalPages: session.totalPages,
        logs: session.logs,
      });

      const temp = await loading.edit({ content: null, embeds: [embed], components: [] });
      session.messageId = temp.id;
      session.panelMessage = temp;

      const row = buildWatchRow(session);
      await temp.edit({ components: [row] });

      watchSessions.set(session.messageId, session);
    } catch {
      message.reply("`❌ API Timeout atau Server Tidak Ditemukan.`");
    }
  }
});

// ================= WATCH BUTTONS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const [action, msgId] = interaction.customId.split(":");
  if (!msgId) return;

  const session = watchSessions.get(msgId);
  if (!session) return;

  if (interaction.user.id !== session.authorId)
    return interaction.reply({ content: "Unauthorized", ephemeral: true });

  await interaction.deferUpdate();

  if (action === "watch_prev") {
    session.page--;
    if (session.page < 0) session.page = 0;
  }

  if (action === "watch_next") {
    session.page++;
    if (session.page >= session.totalPages) session.page = session.totalPages - 1;
  }

  if (action === "watch_refresh") {
    // ✅ refresh panel + clear log biar bersih
    session.logs = [];
    session.panelMessage = interaction.message;
    await refreshWatch(session, interaction.message);
    return;
  }

  if (action === "watch_toggle") {
    session.watchOn = !session.watchOn;
    session.panelMessage = interaction.message;

    // refresh panel biar data paling baru
    await refreshWatch(session, interaction.message);

    if (session.watchOn) startWatchLoop(session);
    else stopWatchLoop(session);

    // update tombol label
    const row = buildWatchRow(session);
    await interaction.message.edit({ components: [row] });
    return;
  }

  // update embed on page change (tanpa fetch biar cepet)
  const embed = buildListEmbed({
    title: session.title,
    queryLabel: session.queryLabel,
    filtered: session.filtered,
    totalClients: session.totalClients,
    page: session.page,
    totalPages: session.totalPages,
    logs: session.logs,
  });

  const row = buildWatchRow(session);
  await interaction.message.edit({ embeds: [embed], components: [row] });
});

client.login(TOKEN);
