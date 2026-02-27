// src/testIndex.ts
import {
  Client,
  GatewayIntentBits,
  Guild,
  ChannelType,
  Role,
  OverwriteResolvable,
  PermissionFlagsBits,
  GuildBasedChannel,
  Message,
  EmbedBuilder
} from "discord.js";
import { BOT_TOKEN, GUILD_ID } from "./config/config";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// -------------------
// PSEUDOBAZA (multi-alliance + shadow authority)
// -------------------
const pseudoDB: Record<string, { roles: Record<string, string>; category?: string; channels: Record<string, string> }> = {};
const shadowDB: Record<string, string[]> = {}; // userId[] dla Shadow Authority

// -------------------
// CLIENT
// -------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const logTime = (msg: string) => {
  const now = new Date();
  const time = now.toISOString().substring(11, 19);
  console.log(`[${time}] ${msg}`);
};

// -------------------
// WALIDACJA
// -------------------
const validateName = (name: string) => /^[A-Za-z ]{4,32}$/.test(name);
const validateTag = (tag: string) => /^[A-Za-z0-9]{3}$/.test(tag);

// -------------------
// SYSTEMOWA ROLA SHADOW AUTHORITY
// -------------------
const setupShadowAuthority = async (guild: Guild) => {
  const authorityIds = process.env.AUTHORITY_IDS?.split(",").map(id => id.trim()) || [];
  if (authorityIds.length === 0) {
    logTime("⚠️ Brak zdefiniowanych AUTHORITY_IDS w zmiennych środowiskowych");
    return null;
  }

  let shadowRole = guild.roles.cache.find(r => r.name === "Shadow Authority");
  if (!shadowRole) {
    shadowRole = await guild.roles.create({
      name: "Shadow Authority",
      color: 0x800080,
      reason: "Rola systemowa Shadow Authority"
    });
    logTime(`✅ Rola systemowa utworzona: ${shadowRole.name}`);
  } else {
    logTime(`⚠️ Rola systemowa już istnieje: ${shadowRole.name}`);
  }

  if (!shadowDB[shadowRole.id]) shadowDB[shadowRole.id] = [];

  const notifyChannel = guild.channels.cache.find(c => c.type === ChannelType.GuildText) as GuildBasedChannel | undefined;
  if (notifyChannel) {
    const embed = new EmbedBuilder()
      .setTitle("Shadow Authority")
      .setDescription(`Lista AUTHORITY_IDS odczytana poprawnie: ${authorityIds.join(", ")}`)
      .setColor(0x800080);
    // @ts-ignore
    await notifyChannel.send({ embeds: [embed] });
  }

  // Aktualizacja shadowDB
  shadowDB[shadowRole.id] = [...authorityIds];

  return { shadowRole, authorityIds, notifyChannel };
};

// -------------------
// CYKL SYNCHRONIZACJI SHADOW AUTHORITY
// -------------------
const startShadowAuthoritySync = async (guild: Guild, shadowRoleId: string, notifyChannel?: GuildBasedChannel) => {
  const syncCycle = async () => {
    const authorityIds = process.env.AUTHORITY_IDS?.split(",").map(id => id.trim()) || [];

    if (!shadowDB[shadowRoleId]) shadowDB[shadowRoleId] = [];
    // 1️⃣ Aktualizacja shadowDB
    shadowDB[shadowRoleId] = [...authorityIds];
    await delay(1000);

    // 2️⃣ Synchronizacja ról
    logTime("🔄 Rozpoczynam cykl synchronizacji Shadow Authority...");

    if (notifyChannel) {
      const embedStart = new EmbedBuilder()
        .setTitle("Shadow Authority")
        .setDescription("Rozpoczynam cykl synchronizacji Shadow Authority...")
        .setColor(0x800080);
      // @ts-ignore
      await notifyChannel.send({ embeds: [embedStart] });
    }

    // Dodaj rolę nowym użytkownikom
    for (const userId of shadowDB[shadowRoleId]) {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) {
        logTime(`❌ Nie znaleziono użytkownika: ${userId}`);
        continue;
      }
      if (!member.roles.cache.has(shadowRoleId)) {
        await member.roles.add(shadowRoleId);
        logTime(`🔄 Przywrócono rolę Shadow Authority dla ${member.user.tag}`);
        if (notifyChannel) {
          const embedUpdate = new EmbedBuilder()
            .setDescription(`🔄 Przywrócono rolę Shadow Authority dla ${member.user.tag}`)
            .setColor(0x800080);
          // @ts-ignore
          await notifyChannel.send({ embeds: [embedUpdate] });
          await delay(1000);
        }
      }
    }

    // Usuń rolę użytkownikom, którzy nie są w ENV
    const membersWithRole = guild.members.cache.filter(m => m.roles.cache.has(shadowRoleId));
    for (const [id, member] of membersWithRole) {
      if (!shadowDB[shadowRoleId].includes(id)) {
        await member.roles.remove(shadowRoleId);
        logTime(`❌ Usunięto rolę Shadow Authority z ${member.user.tag}`);
        if (notifyChannel) {
          const embedRemove = new EmbedBuilder()
            .setDescription(`❌ Usunięto rolę Shadow Authority z ${member.user.tag}`)
            .setColor(0xff0000);
          // @ts-ignore
          await notifyChannel.send({ embeds: [embedRemove] });
          await delay(1000);
        }
      }
    }

    logTime("✅ Cykl synchronizacji Shadow Authority zakończony poprawnie");

    if (notifyChannel) {
      const embedEnd = new EmbedBuilder()
        .setTitle("Shadow Authority")
        .setDescription("✅ Cykl synchronizacji zakończony poprawnie")
        .setColor(0x00ff00);
      // @ts-ignore
      await notifyChannel.send({ embeds: [embedEnd] });
    }

    await delay(2000); // 2s przed kolejnym cyklem
    syncCycle(); // rekurencja
  };

  syncCycle();
};

// -------------------
// PSEUDOKOMENDA CREATE
// -------------------
// [Tu wklej cały kod pseudoCreate z twojego poprzedniego indeksu, bez zmian]

// -------------------
// PSEUDOKOMENDA DELETE
// -------------------
// [Tu wklej cały kod pseudoDelete z twojego poprzedniego indeksu, bez zmian]

// -------------------
// OBSŁUGA WIADOMOŚCI
// -------------------
// [Tu wklej cały kod messageCreate z twojego poprzedniego indeksu]

// -------------------
// READY
// -------------------
client.once("ready", async () => {
  logTime(`Zalogowano jako ${client.user?.tag}`);
  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    logTime(`❌ Nie znaleziono gildii o ID: ${GUILD_ID}`);
    return;
  }

  const shadowSetup = await setupShadowAuthority(guild);
  if (shadowSetup) {
    const { shadowRole, notifyChannel } = shadowSetup;
    startShadowAuthoritySync(guild, shadowRole.id, notifyChannel);
  }
});

client.login(BOT_TOKEN);