// src/testIndex.ts
import {
  Client,
  GatewayIntentBits,
  Guild,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
  VoiceChannel,
  Message,
  EmbedBuilder
} from "discord.js";
import { BOT_TOKEN, GUILD_ID } from "./config/config";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// -------------------
// PSEUDOBAZA (multi-alliance + shadow authority)
// -------------------
const pseudoDB: Record<string, {
  roles: Record<string, string>;
  category?: string;
  channels: Record<string, string>;
  logMessage?: Message; // Wiadomość logów per sojusz
}> = {};

const shadowDB: Record<string, string[]> = {}; // userId[] dla Shadow Authority
let shadowStatusMessage: Message | undefined;

// -------------------
// CLIENT
// -------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
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
// FUNKCJA LOGOWANIA DO JEDNEJ WIADOMOŚCI
// -------------------
const updateLogMessage = async (
  channel: TextChannel,
  content: string,
  existingMessage?: Message
): Promise<Message> => {
  const timestamp = new Date().toLocaleTimeString();
  if (existingMessage) {
    const prevEmbed = existingMessage.embeds[0];
    const prevDesc = prevEmbed?.description || "";
    const newDesc = `${prevDesc}\n[${timestamp}] ${content}`;
    const embed = new EmbedBuilder()
      .setDescription(newDesc)
      .setColor(0x800080)
      .setTimestamp(new Date());
    await existingMessage.edit({ embeds: [embed] });
    return existingMessage;
  } else {
    const embed = new EmbedBuilder()
      .setDescription(`[${timestamp}] ${content}`)
      .setColor(0x800080)
      .setTimestamp(new Date());
    const msg = await channel.send({ embeds: [embed] });
    return msg;
  }
};

// -------------------
// SYSTEMOWA ROLA SHADOW AUTHORITY
// -------------------
const setupShadowAuthority = async (guild: Guild) => {
  const authorityIds = process.env.AUTHORITY_IDS?.split(",").map(id => id.trim()) || [];
  if (!authorityIds.length) return null;

  let shadowRole = guild.roles.cache.find(r => r.name === "Shadow Authority");
  if (!shadowRole) {
    shadowRole = await guild.roles.create({
      name: "Shadow Authority",
      color: 0x800080,
      reason: "Rola systemowa Shadow Authority"
    });
    logTime(`✅ Rola systemowa utworzona: ${shadowRole.name}`);
  }

  let notifyChannel = guild.channels.cache.find(
    c => c.name === "shadow-authority" && c.type === ChannelType.GuildText
  ) as TextChannel | undefined;

  if (!notifyChannel) {
    notifyChannel = await guild.channels.create({
      name: "shadow-authority",
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: shadowRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
      ],
      reason: "Kanał powiadomień Shadow Authority"
    });
  } else {
    await notifyChannel.permissionOverwrites.set([
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: shadowRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
    ]);
  }

  shadowStatusMessage = notifyChannel.messages.cache.first();
  if (!shadowStatusMessage) {
    shadowStatusMessage = await notifyChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("Shadow Authority")
          .setDescription("Status wczytywania...")
          .setColor(0x800080)
      ]
    });
  }

  for (const userId of authorityIds) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) continue;
    if (!member.roles.cache.has(shadowRole.id)) await member.roles.add(shadowRole);
    if (!shadowDB[shadowRole.id]) shadowDB[shadowRole.id] = [];
    if (!shadowDB[shadowRole.id].includes(userId)) shadowDB[shadowRole.id].push(userId);
  }

  return { shadowRole, authorityIds, notifyChannel };
};

// -------------------
// SYNCHRONIZACJA SHADOW AUTHORITY
// -------------------
const synchronizeShadowAuthority = async (
  guild: Guild,
  shadowRoleId: string,
  authorityIds: string[],
  manual = false
) => {
  if (!guild || !shadowStatusMessage) return;
  const currentMembers = await guild.members.fetch();

  const added: string[] = [];
  const removed: string[] = [];

  for (const userId of authorityIds) {
    const member = currentMembers.get(userId);
    if (!member) continue;
    if (!member.roles.cache.has(shadowRoleId)) {
      await member.roles.add(shadowRoleId);
      added.push(member.user.tag);
      if (!shadowDB[shadowRoleId]) shadowDB[shadowRoleId] = [];
      if (!shadowDB[shadowRoleId].includes(userId)) shadowDB[shadowRoleId].push(userId);
      await delay(300);
    }
  }

  for (const [id, member] of currentMembers) {
    if (!authorityIds.includes(id) && member.roles.cache.has(shadowRoleId)) {
      await member.roles.remove(shadowRoleId);
      removed.push(member.user.tag);
      await delay(300);
    }
  }

  shadowDB[shadowRoleId] = currentMembers.filter(m => m.roles.cache.has(shadowRoleId)).map(m => m.id);

  let description = `👥 Uprawnieni użytkownicy:\n${authorityIds.map(id => `<@${id}>`).join(", ")}\n\n`;
  description += manual ? `🕒 Ostatnia synchronizacja ręczna: ${new Date().toLocaleTimeString()}\n\n`
                        : `🕒 Ostatnia synchronizacja automatyczna: ${new Date().toLocaleTimeString()}\n\n`;
  if (added.length) description += `✅ Przyznano role:\n${added.join("\n")}\n\n`;
  if (removed.length) description += `⚠️ Odebrano role:\n${removed.join("\n")}\n\n`;
  if (!added.length && !removed.length) description += "🔄 Brak zmian.";

  await shadowStatusMessage.edit({
    embeds: [new EmbedBuilder().setTitle("Shadow Authority").setDescription(description).setColor(0x800080).setTimestamp(new Date())]
  });
};

// -------------------
// EVENT LISTENER (manual update przy zmianie roli)
// -------------------
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  const shadowRole = newMember.guild.roles.cache.find(r => r.name === "Shadow Authority");
  if (!shadowRole) return;
  const authorityIds = process.env.AUTHORITY_IDS?.split(",").map(id => id.trim()) || [];
  if (!authorityIds.length) return;

  await synchronizeShadowAuthority(newMember.guild, shadowRole.id, authorityIds, true);
});

// -------------------
// LOGI SOJUSZY (kanał tekstowy)
// -------------------
const getAllianceLogChannel = async (guild: Guild, shadowRoleId: string) => {
  let logChannel = guild.channels.cache.find(c => c.name === "alliance-logs" && c.type === ChannelType.GuildText) as TextChannel;
  if (!logChannel) {
    logChannel = await guild.channels.create({
      name: "alliance-logs",
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: shadowRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
      ],
      reason: "Kanał logów sojuszniczych"
    });
  }
  return logChannel;
};

// -------------------
// PSEUDOCREATE
// -------------------
const pseudoCreate = async (guild: Guild, name: string, tag: string) => {
  if (!validateName(name) || !validateTag(tag)) return;
  const key = `${name}•${tag}`;
  if (!pseudoDB[key]) pseudoDB[key] = { roles: {}, channels: {} };
  const alliance = pseudoDB[key];

  const shadowRole = guild.roles.cache.find(r => r.name === "Shadow Authority");
  const logChannel = shadowRole ? await getAllianceLogChannel(guild, shadowRole.id) : undefined;
  if (!logChannel) return;

  if (!alliance.logMessage) {
    alliance.logMessage = await updateLogMessage(logChannel, `📜 Rozpoczęto tworzenie sojuszu "${name} • ${tag}"`);
  }

  const rolesDef = [
    { name: `R5 • ${tag}`, color: 0xff0000 },
    { name: `R4 • ${tag}`, color: 0x0000ff },
    { name: `R3 • ${tag}`, color: 0x00ff00 },
    { name: `${name}`, color: 0xffff00 }
  ];

  // Tworzenie ról
  for (const roleData of rolesDef) {
    let role = guild.roles.cache.find(r => r.name === roleData.name);
    if (!role) {
      await updateLogMessage(logChannel, `Tworzenie roli: ${roleData.name}`, alliance.logMessage);
      role = await guild.roles.create({ name: roleData.name, color: roleData.color, reason: `Sojusz ${name}` });
      await updateLogMessage(logChannel, `✅ Rola utworzona: ${roleData.name}`, alliance.logMessage);
      await delay(500);
    }
    alliance.roles[roleData.name] = role.id;
  }

  // Kategorie
  let category = guild.channels.cache.find(c => c.name === `${name} • ${tag}` && c.type === ChannelType.GuildCategory);
  if (!category) {
    await updateLogMessage(logChannel, `Tworzenie kategorii: ${name} • ${tag}`, alliance.logMessage);
    category = await guild.channels.create({ name: `${name} • ${tag}`, type: ChannelType.GuildCategory });
    await updateLogMessage(logChannel, `📁 Kategoria utworzona: ${name} • ${tag}`, alliance.logMessage);
    alliance.category = category.id;
    await delay(500);
  } else alliance.category = category.id;

  // Tekstowe i głosowe kanały oraz permission
  const textChannels = ["👋 welcome", "📢 announce", "💬 chat", "🛡 staff-room", "✋ join"];
  for (const nameCh of textChannels) {
    let ch = guild.channels.cache.find(c => c.name === nameCh && c.parentId === category.id) as TextChannel;
    if (!ch) {
      await updateLogMessage(logChannel, `Tworzenie kanału tekstowego: ${nameCh}`, alliance.logMessage);
      ch = await guild.channels.create({ name: nameCh, type: ChannelType.GuildText, parent: category.id });
      await updateLogMessage(logChannel, `💬 Text channel utworzony: ${nameCh}`, alliance.logMessage);
    }
    alliance.channels[nameCh] = ch.id;

    const overwrites: any[] = [];
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
    await ch.permissionOverwrites.set(overwrites);
    await delay(250);
  }

  const voiceChannels = ["🎤 General VC", "🎤 Staff VC"];
  for (const nameCh of voiceChannels) {
    let ch = guild.channels.cache.find(c => c.name === nameCh && c.parentId === category.id) as VoiceChannel;
    if (!ch) {
      await updateLogMessage(logChannel, `Tworzenie kanału głosowego: ${nameCh}`, alliance.logMessage);
      ch = await guild.channels.create({ name: nameCh, type: ChannelType.GuildVoice, parent: category.id });
      await updateLogMessage(logChannel, `🔊 Voice channel utworzony: ${nameCh}`, alliance.logMessage);
    }
    alliance.channels[nameCh] = ch.id;

    const overwrites: any[] = [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] }];
    const roles = nameCh === "🎤 Staff VC" ? ["R4","R5"] : ["R3","R4","R5"];
    for (const r of roles) {
      const roleId = alliance.roles[`${r} • ${tag}`];
      if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] });
    }
    await ch.permissionOverwrites.set(overwrites);
    await delay(250);
  }

  await updateLogMessage(logChannel, `🎉 Tworzenie sojuszu "${name} • ${tag}" zakończone!`, alliance.logMessage);

  setTimeout(() => {
    if (alliance.logMessage) alliance.logMessage.delete().catch(() => null);
  }, 10 * 60 * 1000);

  logTime(`🎉 Sojusz ${name} • ${tag} w pełni utworzony!`);
};

// -------------------
// PSEUDODELETE
// -------------------
const pseudoDelete = async (guild: Guild, name: string, tag: string) => {
  if (!validateName(name) || !validateTag(tag)) return;
  const key = `${name}•${tag}`;
  const alliance = pseudoDB[key];
  if (!alliance) return;

  const shadowRole = guild.roles.cache.find(r => r.name === "Shadow Authority");
  const logChannel = shadowRole ? await getAllianceLogChannel(guild, shadowRole.id) : undefined;
  if (!logChannel) return;

  if (!alliance.logMessage) {
    alliance.logMessage = await updateLogMessage(logChannel, `📜 Rozpoczęto usuwanie sojuszu "${name} • ${tag}"`);
  }

  for (const chId of Object.values(alliance.channels)) {
    const ch = guild.channels.cache.get(chId);
    if (ch) {
      await updateLogMessage(logChannel, `Usuwanie kanału: ${ch.name}`, alliance.logMessage);
      await ch.delete();
      await updateLogMessage(logChannel, `🗑 Kanał usunięty: ${ch.name}`, alliance.logMessage);
      await delay(250);
    }
  }

  if (alliance.category) {
    const category = guild.channels.cache.get(alliance.category);
    if (category) {
      await updateLogMessage(logChannel, `Usuwanie kategorii: ${category.name}`, alliance.logMessage);
      await category.delete();
      await updateLogMessage(logChannel, `🗑 Kategoria usunięta: ${category.name}`, alliance.logMessage);
      await delay(250);
    }
  }

  for (const roleId of Object.values(alliance.roles)) {
    const role = guild.roles.cache.get(roleId);
    if (role) {
      await updateLogMessage(logChannel, `Usuwanie roli: ${role.name}`, alliance.logMessage);
      await role.delete();
      await updateLogMessage(logChannel, `🗑 Rola usunięta: ${role.name}`, alliance.logMessage);
      await delay(250);
    }
  }

  await updateLogMessage(logChannel, `🗑 Usuwanie sojuszu "${name} • ${tag}" zakończone!`, alliance.logMessage);

  setTimeout(() => {
    if (alliance.logMessage) alliance.logMessage.delete().catch(() => null);
  }, 10 * 60 * 1000);

  delete pseudoDB[key];
};

// -------------------
// OBSŁUGA WIADOMOŚCI
// -------------------
client.on("messageCreate", async (message: Message) => {
  if (!message.guild || message.author.bot) return;
  if (message.guild.id !== GUILD_ID) return;

  const parts = message.content.trim().split(" ");
  const cmd = parts[0].toLowerCase();
  if (parts.length < 3) return;

  const tag = parts.pop()!;
  const name = parts.slice(1).join(" ");
  if (!validateName(name) || !validateTag(tag)) return;

  if (cmd === "!create") await pseudoCreate(message.guild, name, tag);
  if (cmd === "!delete") await pseudoDelete(message.guild, name, tag);
});

// -------------------
// READY
// -------------------
client.once("ready", async () => {
  logTime(`Zalogowano jako ${client.user?.tag}`);
  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) return;

  const shadowSetup = await setupShadowAuthority(guild);
  if (shadowSetup) {
    const { shadowRole, authorityIds } = shadowSetup;
    setInterval(() => synchronizeShadowAuthority(guild, shadowRole.id, authorityIds), 60_000);
  }
});

client.login(BOT_TOKEN);