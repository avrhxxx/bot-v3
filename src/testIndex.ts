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
const TEST_ALLIANCE = { tag: "CEL", name: "Behemoth Cells" };

// -------------------
// PSEUDOBAZA W INDEKSIE
// -------------------
const pseudoDB: {
  roles: Record<string, string>;
  category?: string;
  channels: Record<string, string>;
} = { roles: {}, channels: {} };

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

  // Potwierdzenie odczytu AUTHORITY_IDS w konsoli
  logTime(`✅ AUTHORITY_IDS odczytane: ${authorityIds.join(", ")}`);

  // Znajdź kanał do powiadomień (na razie pierwszy tekstowy)
  const notifyChannel = guild.channels.cache.find(c => c.type === ChannelType.GuildText) as GuildBasedChannel | undefined;
  if (notifyChannel) {
    const embed = new EmbedBuilder()
      .setTitle("Shadow Authority")
      .setDescription(`Lista AUTHORITY_IDS odczytana poprawnie:\n${authorityIds.join(", ")}`)
      .setColor(0x800080);
    // @ts-ignore
    await notifyChannel.send({ embeds: [embed] });
  }

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
  const syncInterval = 60000; // 60 sekund dla mniej spamu
  setInterval(async () => {
    logTime("🔄 Rozpoczynam cykl synchronizacji Shadow Authority...");
    if (notifyChannel) {
      const embedStart = new EmbedBuilder()
        .setTitle("Shadow Authority")
        .setDescription("Rozpoczynam cykl synchronizacji Shadow Authority...")
        .setColor(0x800080);
      // @ts-ignore
      await notifyChannel.send({ embeds: [embedStart] });
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
          const embedUser = new EmbedBuilder()
            .setTitle("Shadow Authority")
            .setDescription(`Przywrócono rolę Shadow Authority dla ${member.user.tag}`)
            .setColor(0x800080);
          // @ts-ignore
          await notifyChannel.send({ embeds: [embedUser] });
        }
      }
      await delay(1000); // odstęp między powiadomieniami dla użytkowników
    }

    logTime("✅ Cykl synchronizacji Shadow Authority zakończony poprawnie");
    if (notifyChannel) {
      const embedEnd = new EmbedBuilder()
        .setTitle("Shadow Authority")
        .setDescription("Cykl synchronizacji Shadow Authority zakończony poprawnie")
        .setColor(0x00ff00);
      // @ts-ignore
      await notifyChannel.send({ embeds: [embedEnd] });
    }
  }, syncInterval);
};

// -------------------
// PSEUDOKOMENDA CREATE (role, kanały, widoczności jak w starym indeksie)
// -------------------
const pseudoCreate = async (guild: Guild, name: string = TEST_ALLIANCE.name, tag: string = TEST_ALLIANCE.tag) => {
  logTime(`🚀 Pseudokomenda: Tworzenie sojuszu "${name}"`);

  const rolesDef = [
    { name: `R5[${tag}]`, color: 0xff0000 },
    { name: `R4[${tag}]`, color: 0x0000ff },
    { name: `R3[${tag}]`, color: 0x00ff00 },
    { name: `${name} • ${tag}`, color: 0xffff00 }
  ];

  const createdRoles: Record<string, Role> = {};
  for (const roleData of rolesDef) {
    let role = guild.roles.cache.find(r => r.name === roleData.name);
    if (!role) {
      role = await guild.roles.create({ name: roleData.name, color: roleData.color, reason: `Testowy sojusz - ${name}` });
      logTime(`✅ Rola utworzona: ${roleData.name}`);
    } else {
      logTime(`⚠️ Rola już istnieje: ${roleData.name}`);
    }
    createdRoles[roleData.name] = role;
    pseudoDB.roles[roleData.name] = role.id;
    await delay(3000);
  }

  // Kategoria
  let category = guild.channels.cache.find(c => c.name === `${name} • ${tag}` && c.type === ChannelType.GuildCategory);
  if (!category) {
    category = await guild.channels.create({ name: `${name} • ${tag}`, type: ChannelType.GuildCategory });
    pseudoDB.category = category.id;
    logTime(`📁 Kategoria utworzona: ${name} • ${tag}`);
    await delay(5000);
  } else {
    pseudoDB.category = category.id;
    logTime(`⚠️ Kategoria już istnieje: ${name} • ${tag}`);
  }

  // Kanały tekstowe i voice jak w starym indeksie, z permission overwrites
  const textChannels = ["👋 welcome", "📢 announce", "💬 chat", "🛡 staff-room", "✋ join"];
  for (const chName of textChannels) {
    const exists = guild.channels.cache.find(c => c.name === chName && c.parentId === category!.id);
    let ch;
    if (!exists) {
      ch = await guild.channels.create({ name: chName, type: ChannelType.GuildText, parent: category.id });
      logTime(`💬 Text channel utworzony: ${chName}`);
    } else {
      ch = exists;
      logTime(`⚠️ Text channel już istnieje: ${chName}`);
    }
    pseudoDB.channels[chName] = ch.id;

    const overwrites: OverwriteResolvable[] = [];
    switch (chName) {
      case "👋 welcome":
      case "📢 announce":
        overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
        ["R3","R4","R5"].forEach(r => {
          const roleId = pseudoDB.roles[`${r}[${tag}]`]; if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel] });
        });
        break;
      case "💬 chat":
        overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] });
        ["R3","R4","R5"].forEach(r => {
          const roleId = pseudoDB.roles[`${r}[${tag}]`]; if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
        });
        break;
      case "🛡 staff-room":
        overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] });
        ["R4","R5"].forEach(r => {
          const roleId = pseudoDB.roles[`${r}[${tag}]`]; if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
        });
        break;
      case "✋ join":
        overwrites.push({ id: guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel] });
        ["R3","R4","R5"].forEach(r => {
          const roleId = pseudoDB.roles[`${r}[${tag}]`]; if (roleId) overwrites.push({ id: roleId, deny: [PermissionFlagsBits.ViewChannel] });
        });
        break;
    }
    if (ch && (ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildVoice)) {
      await ch.permissionOverwrites.set(overwrites);
    }
    await delay(2000);
  }

  // Kanały głosowe
  const voiceChannels = ["🎤 General VC","🎤 Staff VC"];
  for (const vcName of voiceChannels) {
    const exists = guild.channels.cache.find(c => c.name === vcName && c.parentId === category!.id);
    let ch;
    if (!exists) {
      ch = await guild.channels.create({ name: vcName, type: ChannelType.GuildVoice, parent: category.id });
      logTime(`🔊 Voice channel utworzony: ${vcName}`);
    } else {
      ch = exists;
      logTime(`⚠️ Voice channel już istnieje: ${vcName}`);
    }
    pseudoDB.channels[vcName] = ch.id;

    const overwrites: OverwriteResolvable[] = [];
    overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] });
    if (vcName === "🎤 Staff VC") ["R4","R5"].forEach(r => {
      const roleId = pseudoDB.roles[`${r}[${tag}]`]; if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] });
    });
    if (vcName === "🎤 General VC") ["R3","R4","R5"].forEach(r => {
      const roleId = pseudoDB.roles[`${r}[${tag}]`]; if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] });
    });
    if (ch && (ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildVoice)) {
      await ch.permissionOverwrites.set(overwrites);
    }
    await delay(2000);
  }

  logTime("🎉 Sojusz w pełni utworzony!");
};

// -------------------
// PSEUDOKOMENDA DELETE
// -------------------
const pseudoDelete = async (guild: Guild) => {
  logTime(`🗑 Pseudokomenda: Usuwanie sojuszu "${TEST_ALLIANCE.name}"`);

  for (const chId of Object.values(pseudoDB.channels)) {
    const ch = guild.channels.cache.get(chId);
    if (ch) await ch.delete();
    logTime(`❌ Usunięto kanał: ${ch?.name}`);
    await delay(1000);
  }
  pseudoDB.channels = {};

  if (pseudoDB.category) {
    const category = guild.channels.cache.get(pseudoDB.category);
    if (category) await category.delete();
    logTime(`❌ Usunięto kategorię: ${category?.name}`);
    await delay(1000);
    pseudoDB.category = undefined;
  }

  for (const roleId of Object.values(pseudoDB.roles)) {
    const role = guild.roles.cache.get(roleId);
    if (role) await role.delete();
    logTime(`❌ Usunięto rolę: ${role?.name}`);
    await delay(1000);
  }
  pseudoDB.roles = {};

  logTime(`✅ Sojusz ${TEST_ALLIANCE.name} w pełni usunięty`);
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
    const tag = parts.length > 1 ? parts.pop()! : TEST_ALLIANCE.tag;
    const name = parts.length > 1 ? parts.slice(1).join(" ") : TEST_ALLIANCE.name;
    if (!validateName(name) || !validateTag(tag)) {
      await message.reply("❌ Niepoprawna nazwa lub tag sojuszu");
      return;
    }
    await message.reply(`✅ Komenda !create użyta — rozpoczęto tworzenie sojuszu "${name} • ${tag}" (testowo).`);
    await pseudoCreate(message.guild, name, tag);
  }

  if (cmd === "!delete") {
    await message.reply(`✅ Komenda !delete użyta — rozpoczęto usuwanie sojuszu "${TEST_ALLIANCE.name}" (testowo).`);
    await pseudoDelete(message.guild);
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

  const shadowSetup = await setupShadowAuthority(guild);
  if (shadowSetup) {
    const { shadowRole, authorityIds, notifyChannel } = shadowSetup;
    startShadowAuthoritySync(guild, shadowRole.id, authorityIds, notifyChannel);
  }
});

client.login(BOT_TOKEN);