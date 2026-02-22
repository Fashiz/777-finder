// ================= IMPORT =================
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { fetch } = require("undici");

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
const serverData = [
  { name: "Indopride Roleplay", alias: "idp", cfx: "237yxy" },
  { name: "Nagara", alias: "nagara", cfx: "d7vrzd" },
  { name: "Nusa V", alias: "nusav", cfx: "ele3bm" },
  { name: "Amora State Indonesia", alias: "amora", cfx: "lk6x85" },
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
  if (!raw) return [];
  return raw
    .split(/\s+/)
    .map((t) => normalize(t))
    .filter(Boolean);
};

const nameToTokens = (name) => normalize(name).split(" ");

const matchesAllTokens = (playerName, queryTokens) => {
  if (queryTokens.length === 0) return true;
  const tokens = nameToTokens(playerName);
  return queryTokens.every((q) => tokens.includes(q));
};

function resolveTargetId(input) {
  const found = serverData.find((s) => s.alias === input.toLowerCase());
  if (input.includes("cfx.re/join/")) return input.split("join/")[1];
  return found ? found.cfx : input;
}

async function fetchServer(targetId) {
  const res = await fetch(
    `https://servers-frontend.fivem.net/api/servers/single/${targetId}`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );
  const json = await res.json();
  return json.Data;
}

// ================= WATCH SYSTEM =================
const watchSessions = new Map();
const WATCH_INTERVAL = 30000;

// ================= READY =================
client.on("ready", () =>
  console.log(`🚀 Connected as ${client.user.tag}`)
);

// ================= COMMAND HANDLER =================
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ================= SERVER =================
  // === COMMAND SERVER (BALIK KE STYLE LAMA) ===
if (command === "server") {
  const loadingMsg = await message.reply("`🔄 Fetching real-time leaderboard data...`");
  try {
    const results = await Promise.all(
      serverData.map(async (s) => {
        try {
          const res = await fetch(
            `https://servers-frontend.fivem.net/api/servers/single/${s.cfx}`,
            { headers: { "User-Agent": "Mozilla/5.0" } }
          );
          const json = await res.json();
          return { ...s, players: json.Data?.clients || 0, status: true };
        } catch {
          return { ...s, players: 0, status: false };
        }
      })
    );

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
  } catch (err) {
    loadingMsg.edit("`❌ Gagal mengambil data leaderboard.`");
  }
}

  // ================= FIND =================
  if (command === "find") {
    const input = args[0];
    if (!input) return message.reply("Gunakan `!find <alias>`.");

    const query = args.slice(1).join(" ");
    const tokens = parseQueryTokens(query);
    const targetId = resolveTargetId(input);

    const loading = await message.reply("Syncing...");
    const data = await fetchServer(targetId);

    const players = data.players || [];
    const filtered = players.filter((p) =>
      matchesAllTokens(p.name, tokens)
    );

    let page = 0;
    const perPage = 20;
    const totalPages = Math.ceil(filtered.length / perPage);

    const generate = (p) => {
      const list = filtered
        .slice(p * perPage, (p + 1) * perPage)
        .map((pl, i) => `${i + 1}. (${pl.id}) ${pl.name}`)
        .join("\n");

      return new EmbedBuilder()
        .setColor("#1ABC9C")
        .setTitle(data.hostname.replace(/\^./g, ""))
        .setDescription(
          `Query: ${query || "semua"}\n\n\`\`\`\n${
            list || "Tidak ada player"
          }\n\`\`\``
        )
        .setFooter({
          text: `Page ${p + 1}/${totalPages || 1}`,
        });
    };

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
      embeds: [generate(0)],
      components: [row],
    });

    const col = msg.createMessageComponentCollector({ time: 300000 });

    col.on("collect", async (i) => {
      if (i.user.id !== message.author.id)
        return i.reply({ content: "Unauthorized", ephemeral: true });

      if (i.customId === "find_prev") page--;
      else page++;

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

      await i.update({ embeds: [generate(page)], components: [newRow] });
    });
  }

  // ================= WATCH =================
  if (command === "watch") {
    const input = args[0];
    if (!input) return message.reply("Gunakan `!watch <alias> <query>`.");

    const query = args.slice(1).join(" ");
    const tokens = parseQueryTokens(query);
    const targetId = resolveTargetId(input);

    const loading = await message.reply("Creating watch panel...");
    const data = await fetchServer(targetId);

    const players = data.players || [];
    const filtered = players.filter((p) =>
      matchesAllTokens(p.name, tokens)
    );

    let page = 0;
    const perPage = 20;

    const session = {
      author: message.author.id,
      channel: message.channel.id,
      targetId,
      tokens,
      previous: new Set(filtered.map((p) => p.id)),
      watchOn: false,
      interval: null,
      filtered,
      page,
    };

    const generate = (p) => {
      const list = session.filtered
        .slice(p * perPage, (p + 1) * perPage)
        .map((pl, i) => `${i + 1}. (${pl.id}) ${pl.name}`)
        .join("\n");

      return new EmbedBuilder()
        .setColor("#1ABC9C")
        .setTitle(data.hostname.replace(/\^./g, ""))
        .setDescription(
          `Query: ${query || "semua"}\n\n\`\`\`\n${
            list || "Tidak ada player"
          }\n\`\`\``
        )
        .setFooter({
          text: `Page ${p + 1}/${Math.ceil(session.filtered.length / perPage) || 1}`,
        });
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("watch_prev")
        .setLabel("PREV")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("watch_next")
        .setLabel("NEXT")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("watch_refresh")
        .setLabel("REFRESH")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("watch_toggle")
        .setLabel("WATCH: OFF")
        .setStyle(ButtonStyle.Secondary)
    );

    const msg = await loading.edit({
      content: null,
      embeds: [generate(0)],
      components: [row],
    });

    watchSessions.set(msg.id, session);
  }
});

// ================= BUTTON INTERACTION =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const session = watchSessions.get(interaction.message.id);
  if (!session) return;

  if (interaction.user.id !== session.author)
    return interaction.reply({ content: "Unauthorized", ephemeral: true });

  await interaction.deferUpdate();

  const data = await fetchServer(session.targetId);
  const players = data.players || [];

  if (interaction.customId === "watch_refresh") {
    session.filtered = players.filter((p) =>
      matchesAllTokens(p.name, session.tokens)
    );
  }

  if (interaction.customId === "watch_toggle") {
    session.watchOn = !session.watchOn;

    if (session.watchOn) {
      session.interval = setInterval(async () => {
        const data = await fetchServer(session.targetId);
        const players = data.players || [];
        const filtered = players.filter((p) =>
          matchesAllTokens(p.name, session.tokens)
        );

        const current = new Set(filtered.map((p) => p.id));
        const before = session.previous;

        const joined = filtered.filter((p) => !before.has(p.id));
        const left = [...before].filter((id) => !current.has(id));

        session.previous = current;

        if (joined.length > 0)
          interaction.channel.send(
            "🟢 JOINED\n" +
              joined.map((p) => `+ (${p.id}) ${p.name}`).join("\n")
          );

        if (left.length > 0)
          interaction.channel.send(
            "🔴 LEFT\n" +
              left.map((id) => `- (${id})`).join("\n")
          );
      }, WATCH_INTERVAL);
    } else {
      clearInterval(session.interval);
    }
  }
});

client.login(TOKEN);

