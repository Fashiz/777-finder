const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetch } = require('undici');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

const TOKEN = process.env.TOKEN; 
const PREFIX = '!';

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
    { name: "Our Glory roleplay", alias: "our", cfx: "q96ypp" },
    { name: "Senjakala roleplay", alias: "senja", cfx: "z5oaqp" },
    { name: "Hexos Rp", alias: "hexos", cfx: "rmz57j" },
    { name: "Origami Roleplay", alias: "origami", cfx: "plj9dy" },
    { name: "indostars Roleplay Indo", alias: "indostars", cfx: "mxzeev" },
    { name: "Chronicle Roleplay Indo", alias: "chronicle", cfx: "bammal" },
    { name: "Kotakita Roleplay", alias: "kotakita", cfx: "r35px8" },
    { name: "Satu Mimpi", alias: "satumimpi", cfx: "3e3gdb" },
    { name: "Jing Arena Indonesia", alias: "jing", cfx: "6gqrq4" },
    { name: "Senpai arena", alias: "senpai", cfx: "3mg36b" },
    { name: "caur ffa", alias: "caur", cfx: "vx7685" },
    { name: "Coffe shop 45", alias: "coffee", cfx: "javo7a" },
    { name: "Paleto Raceway", alias: "balap", cfx: "adla85" }
];

client.on('ready', () => console.log(`🚀 System Active | Connected as ${client.user.tag}`));

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // === COMMAND HELP (STYLE ANAK KOMUNITAS) ===
    if (command === 'help') {
        const embed = new EmbedBuilder()
            .setColor('#2F3136') // Warna dark minimalis
            .setTitle('📂 CFX FINDER - DASHBOARD')
            .setDescription('Cek status server FiveM Indonesia langsung lewat Discord.')
            .addFields(
                { name: '🚀 Perintah Utama', value: 
                    '• `!find <alias>` - Cek info lengkap server\n' +
                    '• `!server` - Lihat list server paling ramai\n' +
                    '• `!server find <cfx>` - Cari server pake kode CFX'
                },
                { name: '👥 Cek Player', value: 
                    '• `!find <alias> players` - Liat daftar player\n' +
                    '• `!find <alias> <nama>` - Cari orang di dalem kota'
                },
                { name: '💡 Contoh Biar Gak Bingung', value: 
                    '```\n!find indopride\n!find nagara players\n!server find 237yxy\n```'
                }
            )
            .setFooter({ text: 'Made by 777 Area | Hubungi Admin kalau ada error' })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    // === COMMAND SERVER (LEADERBOARD SESUAI GAMBAR 2) ===
    if (command === 'server') {
        const loadingMsg = await message.reply('`🔄 Fetching real-time leaderboard data...`');

        try {
            // Fetch semua data player secara async
            const results = await Promise.all(serverData.map(async (s) => {
                try {
                    const res = await fetch(`https://servers-frontend.fivem.net/api/servers/single/${s.cfx}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    const json = await res.json();
                    return { ...s, players: json.Data?.clients || 0, status: true };
                } catch {
                    return { ...s, players: 0, status: false };
                }
            }));

            // Sortir dari yang paling rame
            results.sort((a, b) => b.players - a.players);

            const formatLine = (s, i) => {
                const st = s.status ? '✅' : '❌';
                const no = (i + 1).toString().padEnd(2, ' ');
                const name = s.name.toUpperCase().slice(0, 20).padEnd(20, ' ');
                const plys = `[${s.players.toString().padStart(4, ' ')}]`.padEnd(6, ' ');
                return `${st} ${no} ${name} ${plys} ${s.alias}`;
            };

            const embed = new EmbedBuilder()
                .setColor('#F1C40F')
                .setTitle('🏆 FiveM Cfx Finder')
                .setDescription(
                    `\`\`\`\nTotal Server: ${serverData.length} Monitored\nSorted By   : Real-time Player Count\n\`\`\`\n` +
                    `\`\`\`\nSt No Nama Server           Plys   Alias\n── ── ──────────────────── ────── ─────────\n` +
                    `${results.slice(0, 14).map((s, i) => formatLine(s, i)).join('\n')}\n\`\`\`` +
                    `\`\`\`\n${results.slice(14, 28).map((s, i) => formatLine(s, i + 14)).join('\n')}\n\`\`\`` +
                    `\`\`\`\n${results.slice(28, 40).map((s, i) => formatLine(s, i + 28)).join('\n')}\n\`\`\``
                )
                .setFooter({ text: `777 PROJECT || ${new Date().toLocaleTimeString()}` });

            await loadingMsg.edit({ content: null, embeds: [embed] });
        } catch (err) {
            loadingMsg.edit("`❌ Gagal mengambil data leaderboard.`");
        }
    }

    // === COMMAND FIND (REFINED ORIGINAL) ===
    if (command === 'find') {
        let input = args[0];
        const sub = args[1];
        if (!input) return message.reply("Gunakan `!find <alias>`.");

        const found = serverData.find(s => s.alias === input.toLowerCase());
        let targetId = input.includes('cfx.re/join/') ? input.split('join/')[1] : (found ? found.cfx : input);

        try {
            const loadingMsg = await message.reply('`Syncing data...`');
            const response = await fetch(`https://servers-frontend.fivem.net/api/servers/single/${targetId}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            if (!response.ok) throw new Error();
            const resData = await response.json();
            const data = resData.Data;
            const players = data.players || [];
            const cleanHost = data.hostname.replace(/\^./g, '').trim().toUpperCase();

            const keyword = (sub && sub !== 'players') ? sub.toLowerCase() : "";
            const filtered = players.filter(p => p.name.toLowerCase().includes(keyword));
            
            let page = 0;
            const items = 20; 
            const totalPages = Math.ceil(filtered.length / items);

            const generateEmbed = (p) => {
                const list = filtered.slice(p * items, (p + 1) * items).map((pl, i) => {
                    const idx = ((p * items) + i + 1).toString().padStart(2, ' ');
                    // Menyejajarkan ID agar rapi lurus ke bawah
                    const id = pl.id.toString().padEnd(4, ' '); 
                    return `${idx}. (${id}) ${pl.name.slice(0, 35)}`;
                }).join('\n');
                
                return new EmbedBuilder()
                    .setColor('#1ABC9C') // Balik ke warna cyan help biar seragam
                    .setTitle(`🎮 ${cleanHost.slice(0, 80)}`)
                    .setDescription(`**Ditemukan "${sub || 'semua'}": ${filtered.length} player**\n\`\`\`\n${list || 'Tidak ada player.'}\n\`\`\`\n**Total: ${filtered.length}/${data.clients} players**`)
                    .setFooter({ text: `Page ${p + 1}/${totalPages || 1} • Alias: ${input} • 777 PROJECT` });
            };

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('p').setLabel('PREV').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('n').setLabel('NEXT').setStyle(ButtonStyle.Success).setDisabled(totalPages <= 1)
            );

            const msg = await loadingMsg.edit({ content: null, embeds: [generateEmbed(0)], components: [row] });
            const col = msg.createMessageComponentCollector({ time: 300000 });

            col.on('collect', async i => {
                if (i.user.id !== message.author.id) return i.reply({ content: "Unauthorized.", ephemeral: true });
                i.customId === 'p' ? page-- : page++;
                const newRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('p').setLabel('PREV').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
                    new ButtonBuilder().setCustomId('n').setLabel('NEXT').setStyle(ButtonStyle.Success).setDisabled(page === totalPages - 1)
                );
                await i.update({ embeds: [generateEmbed(page)], components: [newRow] });
            });
        } catch (e) {
            message.reply("`❌ API Timeout atau Server Tidak Ditemukan.`");
        }
    }
    }
);


client.login(TOKEN);

