// src/testIndex.ts
import { Client, GatewayIntentBits, Guild, Role, TextChannel, VoiceChannel, CategoryChannel } from "discord.js";
import { BOT_TOKEN, GUILD_ID } from "./config/config";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Tablica testowych sojuszy z offsetem startowym w ms
const alliances = [
  { tag: "CEL", name: "Behemoth Cells", id: "alliance-cel", startOffset: 0 },
  { tag: "TTR", name: "TurboTurtle", id: "alliance-ttr", startOffset: 1000 },
  { tag: "puR", name: "Ghoulion Pursuit", id: "alliance-pur", startOffset: 2000 }
];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const logTime = (msg: string) => {
  const now = new Date();
  const timestamp = now.toISOString().substr(11, 8);
  console.log(`[${timestamp}] ${msg}`);
};

client.once("ready", async () => {
  logTime(`Testowy bot zalogowany jako ${client.user?.tag}`);

  const guild: Guild | undefined = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    console.log(`Nie znaleziono guilda o ID ${GUILD_ID}.`);
    return;
  }

  while (true) {
    // Startujemy sojusze z offsetem równoległym
    alliances.forEach(async (alliance) => {
      setTimeout(async () => {
        logTime(`🚀 Rozpoczynamy tworzenie sojuszu: ${alliance.name} [${alliance.tag}]`);

        // --------------------------
        // 1️⃣ Tworzenie ról
        // --------------------------
        const rolesDef = [
          { name: `R5[${alliance.tag}]`, color: "#FF0000" },
          { name: `R4[${alliance.tag}]`, color: "#0000FF" },
          { name: `R3[${alliance.tag}]`, color: "#00FF00" },
          { name: alliance.name, color: "#FFFF00" }
        ];

        const createdRoles: Record<string, Role> = {};
        for (const { name, color } of rolesDef) {
          let role = guild.roles.cache.find(r => r.name === name);
          if (!role) {
            role = await guild.roles.create({ name, color, reason: `Tworzenie roli dla ${alliance.name}` });
            logTime(`✅ Stworzono rolę: ${name}`);
          } else {
            // ✨ Gate nie przerywa cyklu
            logTime(`Rola ${name} już istnieje, kontynuujemy cykl`);
          }
          createdRoles[name] = role!;
          await delay(3000);
        }

        // --------------------------
        // 2️⃣ Tworzenie kategorii
        // --------------------------
        let category = guild.channels.cache.find(c => c.name === alliance.name && c.type === 4) as CategoryChannel;
        if (!category) {
          category = await guild.channels.create({ name: alliance.name, type: 4 });
          logTime(`✅ Stworzono kategorię: ${alliance.name}`);
          await delay(5000);

          // --------------------------
          // 3️⃣ Tworzenie kanałów tekstowych
          // --------------------------
          const textChannels = ["👋 welcome", "📢 announce", "💬 chat", "🛡 staff-room", "✋ join"];
          for (const chName of textChannels) {
            const ch = await guild.channels.create({ name: chName, type: 0, parent: category.id }) as TextChannel;
            logTime(`✅ Stworzono kanał tekstowy: ${chName}`);
            await delay(4000);
          }

          // --------------------------
          // 4️⃣ Tworzenie kanałów głosowych
          // --------------------------
          const voiceChannels = ["🎤 General VC", "🎤 Staff VC"];
          for (const chName of voiceChannels) {
            const ch = await guild.channels.create({ name: chName, type: 2, parent: category.id }) as VoiceChannel;
            logTime(`✅ Stworzono kanał głosowy: ${chName}`);
            await delay(4000);
          }
        } else {
          logTime(`Kategoria ${alliance.name} już istnieje. Kanały nie zostały tworzone.`);
        }

      }, alliance.startOffset);
    });

    // --------------------------
    // 5️⃣ Czekamy pełne 10 sekund przed usuwaniem, żeby wszystkie sojusze zdążyły się stworzyć
    // --------------------------
    await delay(10000);

    // --------------------------
    // 6️⃣ Usuwanie sojuszy po cyklu
    // --------------------------
    for (const alliance of alliances) {
      logTime(`🗑 Usuwanie sojuszu: ${alliance.name}`);
      const category = guild.channels.cache.find(c => c.name === alliance.name && c.type === 4) as CategoryChannel;
      if (category) {
        for (const ch of category.children.values()) {
          await ch.delete();
          logTime(`❌ Usunięto kanał: ${ch.name}`);
          await delay(2000);
        }
        await category.delete();
        logTime(`❌ Usunięto kategorię: ${alliance.name}`);
        await delay(5000);
      }

      for (const roleName of [`R5[${alliance.tag}]`, `R4[${alliance.tag}]`, `R3[${alliance.tag}]`, alliance.name]) {
        const role = guild.roles.cache.find(r => r.name === roleName);
        if (role) {
          await role.delete();
          logTime(`❌ Usunięto rolę: ${roleName}`);
          await delay(3000);
        }
      }
    }

    logTime(`🔁 Cykl testowy zakończony. Start następnego za 15 sekund...`);
    await delay(15000);
  }
});

client.login(BOT_TOKEN).catch(err => {
  console.error("Nie udało się zalogować testowego bota:", err);
});