// src/testIndex.ts
import {
  Client,
  GatewayIntentBits,
  Guild,
  ChannelType,
  Role
} from "discord.js";
import { BOT_TOKEN, GUILD_ID } from "./config/config";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const alliances = [
  { tag: "CEL", name: "Behemoth Cells", startOffset: 0 },
  { tag: "TTR", name: "TurboTurtle", startOffset: 1000 },
  { tag: "puR", name: "Ghoulion Pursuit", startOffset: 2000 }
];

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const logTime = (msg: string) => {
  const now = new Date();
  const time = now.toISOString().substring(11, 19);
  console.log(`[${time}] ${msg}`);
};

client.once("ready", async () => {
  logTime(`Zalogowano jako ${client.user?.tag}`);

  const guild: Guild | undefined = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    console.log("Nie znaleziono guilda.");
    return;
  }

  while (true) {

    // 🔥 START SOJUSZY Z OFFSETEM
    alliances.forEach(alliance => {
      setTimeout(async () => {

        logTime(`🚀 Start tworzenia: ${alliance.name}`);

        // -------------------
        // ROLE
        // -------------------
        const rolesDef = [
          { name: `R5[${alliance.tag}]`, color: 0xff0000 },
          { name: `R4[${alliance.tag}]`, color: 0x0000ff },
          { name: `R3[${alliance.tag}]`, color: 0x00ff00 },
          { name: alliance.name, color: 0xffff00 }
        ];

        const createdRoles: Record<string, Role> = {};

        for (const roleData of rolesDef) {

          let role = guild.roles.cache.find(r => r.name === roleData.name);

          if (!role) {
            role = await guild.roles.create({
              name: roleData.name,
              color: roleData.color,
              reason: `Stress test - ${alliance.name}`
            });

            logTime(`✅ Rola utworzona: ${roleData.name}`);
          } else {
            logTime(`⚠️ Rola już istnieje: ${roleData.name}`);
          }

          createdRoles[roleData.name] = role;
          await delay(2000);
        }

        // -------------------
        // KATEGORIA
        // -------------------
        let category = guild.channels.cache.find(
          c =>
            c.name === alliance.name &&
            c.type === ChannelType.GuildCategory
        );

        if (!category) {
          category = await guild.channels.create({
            name: alliance.name,
            type: ChannelType.GuildCategory
          });

          logTime(`📁 Kategoria utworzona: ${alliance.name}`);
          await delay(3000);
        }

        if (!category) return;

        // -------------------
        // TEXT CHANNELS
        // -------------------
        const textChannels = [
          "👋 welcome",
          "📢 announce",
          "💬 chat",
          "🛡 staff-room",
          "✋ join"
        ];

        for (const name of textChannels) {

          const exists = guild.channels.cache.find(
            c =>
              c.name === name &&
              c.parentId === category!.id
          );

          if (!exists) {
            await guild.channels.create({
              name,
              type: ChannelType.GuildText,
              parent: category.id
            });

            logTime(`💬 Text channel: ${name}`);
          }

          await delay(2000);
        }

        // -------------------
        // VOICE CHANNELS
        // -------------------
        const voiceChannels = [
          "🎤 General VC",
          "🎤 Staff VC"
        ];

        for (const name of voiceChannels) {

          const exists = guild.channels.cache.find(
            c =>
              c.name === name &&
              c.parentId === category!.id
          );

          if (!exists) {
            await guild.channels.create({
              name,
              type: ChannelType.GuildVoice,
              parent: category.id
            });

            logTime(`🔊 Voice channel: ${name}`);
          }

          await delay(2000);
        }

      }, alliance.startOffset);
    });

    // ⏳ CZEKAMY 15 SEKUND NA PEŁNE STWORZENIE
    await delay(15000);

    // -------------------
    // USUWANIE
    // -------------------
    for (const alliance of alliances) {

      logTime(`🗑 Usuwanie: ${alliance.name}`);

      const category = guild.channels.cache.find(
        c =>
          c.name === alliance.name &&
          c.type === ChannelType.GuildCategory
      );

      if (category && category.type === ChannelType.GuildCategory) {

        for (const ch of category.children.cache.values()) {
          await ch.delete();
          logTime(`❌ Usunięto kanał: ${ch.name}`);
          await delay(1000);
        }

        await category.delete();
        logTime(`❌ Usunięto kategorię: ${alliance.name}`);
      }

      const roleNames = [
        `R5[${alliance.tag}]`,
        `R4[${alliance.tag}]`,
        `R3[${alliance.tag}]`,
        alliance.name
      ];

      for (const name of roleNames) {
        const role = guild.roles.cache.find(r => r.name === name);
        if (role) {
          await role.delete();
          logTime(`❌ Usunięto rolę: ${name}`);
          await delay(1000);
        }
      }
    }

    logTime("🔁 Nowy cykl za 10 sekund...");
    await delay(10000);
  }
});

client.login(BOT_TOKEN);