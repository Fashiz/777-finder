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

const serverData = [
  { name: "Indopride Roleplay", alias: "idp", cfx: "237yxy" },
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

// ------------------------
// Utils: parsing + matching
// ------------------------
const normalize = (str) =>
  (str || "")
    .replace(/\^./g, "") // hapus ^1 ^2 dst
    .toLowerCase()
    .replace(/[_\-.,/\\|]+/g, " ") // separator jadi spasi
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // buang simbol aneh (unicode safe)
    .replace(/\s+/g, " ")
    .trim();

// split query jadi token.
// support: "kata dua" dianggap 1 token (quoted)
const parseQueryTokens = (raw) => {
  const s = (raw || "").trim();
  if (!s) return [];
  const tokens = [];
  const re = /"([^"]+)"|(\S+)/g;
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

// token match: query token harus match salah satu token nama secara EXACT.
// Jadi "rd" ga bakal match "raden".
const matchesAllTokens = (playerName, queryTokens) => {
  if (queryTokens.length === 0) return true;
  const tokens = nameToTokens(playerName);
  if (tokens.length === 0) return false;
  return queryTokens.every((q) => tokens.includes(q));
};

// ------------------------
client.on("ready", () =>
  console.log(`🚀 System Active | Connected as ${client.user.tag}`)
);

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = (args.shift() || "").toLowerCase();

  // === COMMAND HELP ===
  if (command === "help") {
    const embed = new EmbedBuilder()
      .setColor("#2F3136")
      .setTitle("📂 CFX FINDER - DASHBOARD")
      .setDescription("Cek status server FiveM Indonesia langsung lewat Discord.")
      .addFields(
        {
          name: "🚀 Perintah Utama",
          value:
            "• `!find <alias>` - Cek info lengkap server\n" +
            "• `!server` - Lihat list server paling ramai\n" +
            "• `!server find <cfx>` - Cari server pake kode CFX",
        },
        {
          name: "👥 Cek Player",
          value:
            "• `!find <alias> players` - Liat daftar player\n" +
            '• `!find <alias> <nama...>` - Cari orang (match kata, bukan substring)\n' +
            '• contoh: `!find idp rd` ga bakal keluar "raden"',
        },
        {
          name: "💡 Contoh",
          value: "```\n!find idp\n!find nagara players\n!find idp rd trs\n!find idp \"rd trs\"\n```",
        }
      )
      .setFooter({ text: "Made by 777 Area | Hubungi Admin" })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  // === COMMAND SERVER ===
  if (command === "server") {
    const loadingMsg = await message.reply(
      "`🔄 Fetching real-time leaderboard data...`"
    );
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

  // === COMMAND FIND ===
  if (command === "find") {
    const input = args[0];
    if (!input) return message.reply("Gunakan `!find <alias>`.");

    // baca rawQuery dari message biar support multi kata & tanda kutip
    const rawAfterAlias = message.content
      .slice(PREFIX.length)
      .trim()
      .replace(/^find\s+/i, "") // buang kata "find"
      .slice(input.length)
      .trim();

    const found = serverData.find((s) => s.alias === input.toLowerCase());
    const targetId = input.includes("cfx.re/join/")
      ? input.split("join/")[1]
      : found
      ? found.cfx
      : input;

    const isPlayers = normalize(rawAfterAlias) === "players";

    // tokens query (kalau kosong & bukan players => tampil semua)
    const queryTokens = isPlayers ? [] : parseQueryTokens(rawAfterAlias);

    try {
      const loadingMsg = await message.reply("`Syncing data...`");
      const response = await fetch(
        `https://servers-frontend.fivem.net/api/servers/single/${targetId}`,
        { headers: { "User-Agent": "Mozilla/5.0" } }
      );

      if (!response.ok) throw new Error("fetch failed");
      const resData = await response.json();
      const data = resData.Data;

      const players = data.players || [];
      const cleanHost = (data.hostname || "UNKNOWN SERVER")
        .replace(/\^./g, "")
        .trim()
        .toUpperCase();

      // FILTER: exact token match (bukan substring)
      const filtered = players.filter((p) =>
        matchesAllTokens(p.name || "", queryTokens)
      );

      let page = 0;
      const items = 20;
      const totalPages = Math.ceil(filtered.length / items);

      const generateEmbed = (p) => {
        const list = filtered
          .slice(p * items, (p + 1) * items)
          .map((pl, i) => {
            const idx = (p * items + i + 1).toString().padStart(2, " ");
            const id = (pl.id ?? "").toString().padEnd(4, " ");
            const nm = (pl.name || "").slice(0, 35);
            return `${idx}. (${id}) ${nm}`;
          })
          .join("\n");

        const queryLabel =
          isPlayers || queryTokens.length === 0
            ? "semua"
            : rawAfterAlias;

        return new EmbedBuilder()
          .setColor("#1ABC9C")
          .setTitle(`🎮 ${cleanHost.slice(0, 80)}`)
          .setDescription(
            `**Ditemukan "${queryLabel}": ${filtered.length} player**\n` +
              `\`\`\`\n${list || "Tidak ada player."}\n\`\`\`\n` +
              `**Total: ${filtered.length}/${data.clients} players**`
          )
          .setFooter({
            text: `Page ${p + 1}/${totalPages || 1} • Alias: ${input} • 777 PROJECT`,
          });
      };

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("p")
          .setLabel("PREV")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("n")
          .setLabel("NEXT")
          .setStyle(ButtonStyle.Success)
          .setDisabled(totalPages <= 1)
      );

      const msg = await loadingMsg.edit({
        content: null,
        embeds: [generateEmbed(0)],
        components: [row],
      });

      const col = msg.createMessageComponentCollector({ time: 300000 });

      col.on("collect", async (i) => {
        if (i.user.id !== message.author.id)
          return i.reply({ content: "Unauthorized.", ephemeral: true });

        if (i.customId === "p") page--;
        else page++;

        const newRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("p")
            .setLabel("PREV")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId("n")
            .setLabel("NEXT")
            .setStyle(ButtonStyle.Success)
            .setDisabled(page === totalPages - 1)
        );

        await i.update({ embeds: [generateEmbed(page)], components: [newRow] });
      });
    } catch (e) {
      message.reply("`❌ API Timeout atau Server Tidak Ditemukan.`");
    }
  }
});

client.login(TOKEN);
