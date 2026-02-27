// src/testIndex.ts
import {
  Client,
  GatewayIntentBits,
  Guild,
  ChannelType,
  OverwriteResolvable,
  PermissionFlagsBits,
  GuildBasedChannel,
  Message
} from "discord.js";
import { BOT_TOKEN, GUILD_ID } from "./config/config";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// -------------------
// PSEUDOBAZA (multi-alliance)
// -------------------
const pseudoDB: Record<string, { roles: Record<string, string>; category?: string; channels: Record<string, string> }> = {};

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

  // Sprawdź czy rola istnieje, jeśli nie – stwórz
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

  // Potwierdzenie odczytu AUTHORITY_IDS w konsoli
  logTime(`✅ AUTHORITY_IDS odczytane: ${authorityIds.join(", ")}`);

  // Znajdź kanał do powiadomień (na razie pierwszy tekstowy)
  const notifyChannel = guild.channels.cache.find(c => c.type === ChannelType.GuildText) as GuildBasedChannel | undefined;
  if (notifyChannel) {
    // @ts-ignore
    await notifyChannel.send(`✅ Lista AUTHORITY_IDS odczytana poprawnie: ${authorityIds.join(", ")}`);
  }

  // Przypisz rolę użytkownikom z listy
  for (const userId of authorityIds) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) {
      logTime(`❌ Nie znaleziono użytkownika o ID: ${userId}`);
      continue;
    }
    if (!member.roles.cache.has(shadowRole.id)) {
      await member.roles.add(shadowRole);
      logTime(`✅ Przypisano rolę Shadow Authority do ${member.user.tag}`);
    } else {
      logTime(`⚠️ Użytkownik ${member.user.tag} już ma rolę Shadow Authority`);
    }
  }

  return { shadowRole, authorityIds, notifyChannel };
};

// -------------------
// CYKL SYNCHRONIZACJI SHADOW AUTHORITY
// -------------------
const startShadowAuthoritySync = async (guild: Guild, shadowRoleId: string, authorityIds: string[], notifyChannel?: GuildBasedChannel) => {
  const syncInterval = 15000; // 15 sekund
  setInterval(async () => {
    logTime("🔄 Rozpoczynam cykl synchronizacji Shadow Authority...");
    if (notifyChannel) {
      // @ts-ignore
      await notifyChannel.send("🔄 Rozpoczynam cykl synchronizacji Shadow Authority...");
    }

    for (const userId of authorityIds) {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) {
        logTime(`❌ Nie znaleziono użytkownika do synchronizacji Shadow Authority: ${userId}`);
        continue;
      }
      if (!member.roles.cache.has(shadowRoleId)) {
        await member.roles.add(shadowRoleId);
        logTime(`🔄 Przywrócono rolę Shadow Authority dla ${member.user.tag}`);
        if (notifyChannel) {
          // @ts-ignore
          await notifyChannel.send(`🔄 Przywrócono rolę Shadow Authority dla ${member.user.tag}`);
        }
      }
    }

    logTime("✅ Cykl synchronizacji Shadow Authority zakończony poprawnie");
    if (notifyChannel) {
      // @ts-ignore
      await notifyChannel.send("✅ Cykl synchronizacji Shadow Authority zakończony poprawnie");
    }
  }, syncInterval);
};

// -------------------
// PSEUDOKOMENDA CREATE
// (Twój oryginalny kod pseudoCreate)
// -------------------
const pseudoCreate = async (guild: Guild, name: string, tag: string) => {
  const key = `${name}•${tag}`;
  logTime(`🚀 Tworzenie sojuszu "${name}"`);
  if (!pseudoDB[key]) pseudoDB[key] = { roles: {}, channels: {} };
  // dalej Twój kod pseudoCreate pozostaje bez zmian
};

// -------------------
// PSEUDOKOMENDA DELETE
// (Twój oryginalny kod pseudoDelete)
// -------------------
const pseudoDelete = async (guild: Guild, name: string, tag: string) => {
  const key = `${name}•${tag}`;
  const alliance = pseudoDB[key];
  if (!alliance) {
    logTime(`❌ Sojusz "${name} • ${tag}" nie istnieje`);
    return;
  }
  // dalej Twój kod pseudoDelete pozostaje bez zmian
};

// -------------------
// OBSŁUGA WIADOMOŚCI
// -------------------
client.on("messageCreate", async (message: Message) => {
  if (!message.guild || message.author.bot) return;
  if (message.guild.id !== GUILD_ID) return;

  const parts = message.content.trim().split(" ");
  const cmd = parts[0].toLowerCase();

  if (cmd === "!create") {
    if (parts.length < 3) {
      await message.reply("❌ Podaj nazwę i tag sojuszu, np. `!create Behemoth CEL`");
      return;
    }
    const tag = parts.pop()!;
    const name = parts.slice(1).join(" ");
    if (!validateName(name) || !validateTag(tag)) return;
    await message.reply(`✅ Komenda !create użyta — rozpoczęto tworzenie sojuszu "${name} • ${tag}" (testowo).`);
    await pseudoCreate(message.guild, name, tag);
  }

  if (cmd === "!delete") {
    if (parts.length < 3) {
      await message.reply("❌ Podaj nazwę i tag sojuszu do usunięcia, np. `!delete Behemoth CEL`");
      return;
    }
    const tag = parts.pop()!;
    const name = parts.slice(1).join(" ");
    if (!validateName(name) || !validateTag(tag)) return;
    await message.reply(`✅ Komenda !delete użyta — rozpoczęto usuwanie sojuszu "${name} • ${tag}" (testowo).`);
    await pseudoDelete(message.guild, name, tag);
  }
});

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

  // Setup Shadow Authority i start synchronizacji
  const shadowSetup = await setupShadowAuthority(guild);
  if (shadowSetup) {
    const { shadowRole, authorityIds, notifyChannel } = shadowSetup;
    startShadowAuthoritySync(guild, shadowRole.id, authorityIds, notifyChannel);
  }
});

client.login(BOT_TOKEN);