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

// ================= SERVER LIST =================
const serverData = [
  { name: "Indopride Roleplay", alias: "idp", cfx: "237yxy" },
  { name: "Nagara", alias: "nagara", cfx: "d7vrzd" },
  { name: "Nusa V", alias: "nusav", cfx: "ele3bm" },
];

// ================= MATCH SYSTEM =================
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
  return s.split(/\s+/).map((t) => normalize(t));
};

const nameToTokens = (name) => normalize(name).split(" ");

const matchesAllTokensSmart = (playerName, queryTokens) => {
  if (queryTokens.length === 0) return true;
  const tokens = nameToTokens(playerName);
  return queryTokens.every((q) => {
    if (q.length <= 3) return tokens.some((t) => t.startsWith(q));
    return tokens.includes(q);
  });
};

// ================= FETCH =================
async function fetchServerData(targetId) {
  const response = await fetch(
    `https://servers-frontend.fivem.net/api/servers/single/${targetId}`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );
  const resData = await response.json();
  return resData.Data;
}

function resolveTargetId(input) {
  const found = serverData.find((s) => s.alias === input.toLowerCase());
  if (input.includes("cfx.re/join/")) return input.split("join/")[1];
  return found ? found.cfx : input;
}

// ================= WATCH SYSTEM =================
const watchSessions = new Map();
const WATCH_INTERVAL_MS = 30000;

// ================= READY =================
client.on("ready", () =>
  console.log(`🚀 Connected as ${client.user.tag}`)
);

// ================= COMMAND =================
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "watch") {
    const input = args[0];
    if (!input) return message.reply("Gunakan `!watch <alias> <query>`");

    const rawQuery = args.slice(1).join(" ");
    const queryTokens = parseQueryTokens(rawQuery);
    const targetId = resolveTargetId(input);

    const loading = await message.reply("Loading watch panel...");
    const data = await fetchServerData(targetId);

    const players = data.players || [];
    const filtered = players.filter((p) =>
      matchesAllTokensSmart(p.name, queryTokens)
    );

    const embed = new EmbedBuilder()
      .setColor("#1ABC9C")
      .setTitle(data.hostname.replace(/\^./g, ""))
      .setDescription(
        `Query: **${rawQuery || "semua"}**\nTotal: **${filtered.length}**`
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("refresh")
        .setLabel("REFRESH")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("toggle")
        .setLabel("WATCH: OFF")
        .setStyle(ButtonStyle.Secondary)
    );

    const msg = await loading.edit({
      content: null,
      embeds: [embed],
      components: [row],
    });

    watchSessions.set(msg.id, {
      messageId: msg.id,
      channelId: message.channel.id,
      authorId: message.author.id,
      targetId,
      queryTokens,
      queryLabel: rawQuery || "semua",
      previousPlayerIds: new Set(filtered.map((p) => p.id)),
      watchOn: false,
      interval: null,
    });
  }
});

// ================= BUTTON =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const session = watchSessions.get(interaction.message.id);
  if (!session) return;

  if (interaction.user.id !== session.authorId)
    return interaction.reply({ content: "Unauthorized", ephemeral: true });

  await interaction.deferUpdate();

  if (interaction.customId === "refresh") {
    const data = await fetchServerData(session.targetId);
    const players = data.players || [];
    const filtered = players.filter((p) =>
      matchesAllTokensSmart(p.name, session.queryTokens)
    );

    session.previousPlayerIds = new Set(filtered.map((p) => p.id));

    const embed = new EmbedBuilder()
      .setColor("#1ABC9C")
      .setTitle(data.hostname.replace(/\^./g, ""))
      .setDescription(
        `Query: **${session.queryLabel}**\nTotal: **${filtered.length}**`
      )
      .setTimestamp();

    await interaction.message.edit({ embeds: [embed] });
  }

  if (interaction.customId === "toggle") {
    session.watchOn = !session.watchOn;

    if (session.watchOn) {
      session.interval = setInterval(async () => {
        const channel = await client.channels.fetch(session.channelId);
        const data = await fetchServerData(session.targetId);
        const players = data.players || [];

        const filtered = players.filter((p) =>
          matchesAllTokensSmart(p.name, session.queryTokens)
        );

        const currentSet = new Set(filtered.map((p) => p.id));
        const beforeSet = session.previousPlayerIds;

        const joined = filtered.filter((p) => !beforeSet.has(p.id));
        const left = [...beforeSet].filter(
          (id) => !currentSet.has(id)
        );

        session.previousPlayerIds = currentSet;

        if (joined.length > 0) {
          channel.send(
            `🟢 **${session.queryLabel.toUpperCase()} JOINED**\n` +
              joined.map((p) => `+ (${p.id}) ${p.name}`).join("\n")
          );
        }

        if (left.length > 0) {
          channel.send(
            `🔴 **${session.queryLabel.toUpperCase()} LEFT**\n` +
              left.map((id) => `- (${id})`).join("\n")
          );
        }
      }, WATCH_INTERVAL_MS);
    } else {
      clearInterval(session.interval);
    }

    const newRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("refresh")
        .setLabel("REFRESH")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("toggle")
        .setLabel(session.watchOn ? "WATCH: ON" : "WATCH: OFF")
        .setStyle(
          session.watchOn ? ButtonStyle.Danger : ButtonStyle.Secondary
        )
    );

    await interaction.message.edit({ components: [newRow] });
  }
});

client.login(TOKEN);
