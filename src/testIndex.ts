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

  shadowDB[shadowRole.id] = [...authorityIds];
  return { shadowRole, notifyChannel };
};

// -------------------
// CYKL SYNCHRONIZACJI SHADOW AUTHORITY
// -------------------
const startShadowAuthoritySync = async (guild: Guild, shadowRoleId: string, notifyChannel?: GuildBasedChannel) => {
  const syncCycle = async () => {
    const authorityIds = process.env.AUTHORITY_IDS?.split(",").map(id => id.trim()) || [];
    shadowDB[shadowRoleId] = [...authorityIds];
    await delay(1000);

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
      if (!member) continue;
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

    await delay(2000);
    syncCycle();
  };

  syncCycle();
};

// -------------------
// PSEUDOKOMENDA CREATE
// -------------------
const pseudoCreate = async (guild: Guild, name: string, tag: string) => {
  const key = `${name}•${tag}`;
  logTime(`🚀 Tworzenie sojuszu "${name} • ${tag}"`);
  if (!pseudoDB[key]) pseudoDB[key] = { roles: {}, channels: {} };
  const alliance = pseudoDB[key];

  const rolesDef = [
    { name: `R5 • ${tag}`, color: 0xff0000 },
    { name: `R4 • ${tag}`, color: 0x0000ff },
    { name: `R3 • ${tag}`, color: 0x00ff00 },
    { name: `${name}`, color: 0xffff00 }
  ];

  for (const roleData of rolesDef) {
    let role = guild.roles.cache.find(r => r.name === roleData.name);
    if (!role) {
      role = await guild.roles.create({ name: roleData.name, color: roleData.color, reason: `Sojusz ${name}` });
      logTime(`✅ Rola utworzona: ${roleData.name}`);
    } else {
      logTime(`⚠️ Rola już istnieje: ${roleData.name}`);
    }
    alliance.roles[roleData.name] = role.id;
    await delay(1000);
  }

  let category = guild.channels.cache.find(c => c.name === `${name} • ${tag}` && c.type === ChannelType.GuildCategory);
  if (!category) {
    category = await guild.channels.create({ name: `${name} • ${tag}`, type: ChannelType.GuildCategory });
    logTime(`📁 Kategoria utworzona: ${name} • ${tag}`);
    alliance.category = category.id;
    await delay(1000);
  } else {
    logTime(`⚠️ Kategoria już istnieje: ${name} • ${tag}`);
    alliance.category = category.id;
  }

  if (!category) return;

  const textChannels = ["👋 welcome", "📢 announce", "💬 chat", "🛡 staff-room", "✋ join"];
  for (const nameCh of textChannels) {
    let ch = guild.channels.cache.find(c => c.name === nameCh && c.parentId === category.id);
    if (!ch) {
      ch = await guild.channels.create({ name: nameCh, type: ChannelType.GuildText, parent: category.id });
      logTime(`💬 Text channel utworzony: ${nameCh}`);
    } else {
      logTime(`⚠️ Text channel już istnieje: ${nameCh}`);
    }
    alliance.channels[nameCh] = ch.id;

    const overwrites: OverwriteResolvable[] = [];
    switch (nameCh) {
      case "👋 welcome":
      case "📢 announce":
        overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
        ["R3","R4","R5"].forEach(r => {
          const roleId = alliance.roles[`${r} • ${tag}`];
          if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel] });
        });
        break;
      case "💬 chat":
        overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] });
        ["R3","R4","R5"].forEach(r => {
          const roleId = alliance.roles[`${r} • ${tag}`];
          if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
        });
        break;
      case "🛡 staff-room":
        overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] });
        ["R4","R5"].forEach(r => {
          const roleId = alliance.roles[`${r} • ${tag}`];
          if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
        });
        break;
      case "✋ join":
        overwrites.push({ id: guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel] });
        ["R3","R4","R5"].forEach(r => {
          const roleId = alliance.roles[`${r} • ${tag}`];
          if (roleId) overwrites.push({ id: roleId, deny: [PermissionFlagsBits.ViewChannel] });
        });
        break;
    }

    if (ch && (ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildVoice)) {
      await ch.permissionOverwrites.set(overwrites);
    }
    await delay(500);
  }

  const voiceChannels = ["🎤 General VC", "🎤 Staff VC"];
  for (const nameCh of voiceChannels) {
    let ch = guild.channels.cache.find(c => c.name === nameCh && c.parentId === category.id);
    if (!ch) {
      ch = await guild.channels.create({ name: nameCh, type: ChannelType.GuildVoice, parent: category.id });
      logTime(`🔊 Voice channel utworzony: ${nameCh}`);
    } else {
      logTime(`⚠️ Voice channel już istnieje: ${nameCh}`);
    }
    alliance.channels[nameCh] = ch.id;

    const overwrites: OverwriteResolvable[] = [];
    overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] });

    if (nameCh === "🎤 Staff VC") ["R4","R5"].forEach(r => {
      const roleId = alliance.roles[`${r} • ${tag}`];
      if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] });
    });

    if (nameCh === "🎤 General VC") ["R3","R4","R5"].forEach(r => {
      const roleId = alliance.roles[`${r} • ${tag}`];
      if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] });
    });

    if (ch && (ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildVoice)) {
      await ch.permissionOverwrites.set(overwrites);
    }
    await delay(500);
  }

  logTime(`🎉 Sojusz ${name} • ${tag} w pełni utworzony!`);
};

// -------------------
// PSEUDOKOMENDA DELETE
// -------------------
const pseudoDelete = async (guild: Guild, name: string, tag: string) => {
  const key = `${name}•${tag}`;
  const alliance = pseudoDB[key];
  if (!alliance) {
    logTime(`❌ Sojusz "${name} • ${tag}" nie istnieje`);
    return;
  }

  for (const chId of Object.values(alliance.channels)) {
    const ch = guild.channels.cache.get(chId);
    if (ch) await ch.delete();
    logTime(`❌ Usunięto kanał: ${ch?.name}`);
    await delay(500);
  }

  if (alliance.category) {
    const category = guild.channels.cache.get(alliance.category);
    if (category) await category.delete();
    logTime(`❌ Usunięto kategorię: ${category?.name}`);
    await delay(500);
  }

  for (const roleId of Object.values(alliance.roles)) {
    const role = guild.roles.cache.get(roleId);
    if (role) await role.delete();
    logTime(`❌ Usunięto rolę: ${role?.name}`);
    await delay(500);
  }

  delete pseudoDB[key];
  logTime(`✅ Sojusz ${name} • ${tag} w pełni usunięty`);
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
    if (!validateName(name)) {
      await message.reply("❌ Niepoprawna nazwa sojuszu.");
      return;
    }
    if (!validateTag(tag)) {
      await message.reply("❌ Niepoprawny tag.");
      return;
    }
    await message.reply(`✅ Komenda !create użyta — rozpoczęto tworzenie sojuszu "${name} • ${tag}"`);
    await pseudoCreate(message.guild, name, tag);
  }

  if (cmd === "!delete") {
    if (parts.length < 3) {
      await message.reply("❌ Podaj nazwę i tag sojuszu do usunięcia, np. `!delete Behemoth CEL`");
      return;
    }
    const tag = parts.pop()!;
    const name = parts.slice(1).join(" ");
    if (!validateName(name)) {
      await message.reply("❌ Niepoprawna nazwa sojuszu.");
      return;
    }
    if (!validateTag(tag)) {
      await message.reply("❌ Niepoprawny tag.");
      return;
    }
    await message.reply(`✅ Komenda !delete użyta — rozpoczęto usuwanie sojuszu "${name} • ${tag}"`);
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

  const shadowSetup = await setupShadowAuthority(guild);
  if (shadowSetup) {
    const { shadowRole, notifyChannel } = shadowSetup;
    startShadowAuthoritySync(guild, shadowRole.id, notifyChannel);
  }
});

client.login(BOT_TOKEN);