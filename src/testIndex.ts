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
// PSEUDOBAZA
// -------------------
const pseudoDB: Record<string, {
  roles: Record<string, string>;
  category?: string;
  channels: Record<string, string>;
  logMessage?: Message;
}> = {};

const shadowDB: Record<string, string[]> = {}; // Shadow Authority

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
  console.log(`[${now.toISOString().substring(11, 19)}] ${msg}`);
};

// -------------------
// WALIDACJA
// -------------------
const validateName = (name: string) => /^[A-Za-z ]{4,32}$/.test(name);
const validateTag = (tag: string) => /^[A-Za-z0-9]{3}$/.test(tag);

// -------------------
// FUNKCJA LOGOWANIA
// -------------------
const updateLogMessage = async (
  channel: TextChannel,
  content: string,
  existingMessage?: Message
): Promise<Message> => {
  const timestamp = new Date().toLocaleTimeString();
  const prevDesc = existingMessage?.embeds[0]?.description || "";
  const newDesc = `${prevDesc}\n[${timestamp}] ${content}`;
  const embed = new EmbedBuilder().setDescription(newDesc).setColor(0x800080).setTimestamp(new Date());

  if (existingMessage) {
    await existingMessage.edit({ embeds: [embed] });
    return existingMessage;
  } else {
    return await channel.send({ embeds: [embed] });
  }
};

// -------------------
// SHADOW AUTHORITY
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
    logTime(`✅ Utworzono rolę Shadow Authority`);
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
      reason: "Kanał Shadow Authority"
    });
  }

  // Stała wiadomość dziennika
  let statusMessage: Message | undefined = notifyChannel.messages.cache.first();
  if (!statusMessage) {
    statusMessage = await notifyChannel.send({ embeds: [new EmbedBuilder().setTitle("Shadow Authority Log").setDescription("Dziennik aktywności...").setColor(0x800080)] });
  }

  // Nadanie ról
  for (const userId of authorityIds) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) continue;
    if (!member.roles.cache.has(shadowRole.id)) await member.roles.add(shadowRole);
    if (!shadowDB[shadowRole.id]) shadowDB[shadowRole.id] = [];
    if (!shadowDB[shadowRole.id].includes(userId)) shadowDB[shadowRole.id].push(userId);
  }

  return { shadowRole, authorityIds, notifyChannel, statusMessage };
};

// -------------------
// SYNCHRONIZACJA SHADOW AUTHORITY
// -------------------
const synchronizeShadowAuthority = async (
  guild: Guild,
  shadowRoleId: string,
  authorityIds: string[],
  notifyChannel?: TextChannel,
  statusMessage?: Message,
  manual = false
) => {
  if (!guild) return;
  const members = await guild.members.fetch();

  const added: string[] = [];
  const removed: string[] = [];

  for (const userId of authorityIds) {
    const member = members.get(userId);
    if (!member) continue;
    if (!member.roles.cache.has(shadowRoleId)) {
      await member.roles.add(shadowRoleId);
      added.push(member.user.tag);
      if (!shadowDB[shadowRoleId]) shadowDB[shadowRoleId] = [];
      if (!shadowDB[shadowRoleId].includes(userId)) shadowDB[shadowRoleId].push(userId);
      await delay(1000);
    }
  }

  for (const [id, member] of members) {
    if (!authorityIds.includes(id) && member.roles.cache.has(shadowRoleId)) {
      await member.roles.remove(shadowRoleId);
      removed.push(member.user.tag);
      await delay(1000);
    }
  }

  shadowDB[shadowRoleId] = members.filter(m => m.roles.cache.has(shadowRoleId)).map(m => m.id);

  if (statusMessage) {
    let desc = `👥 Uprawnieni:\n${authorityIds.map(id => `<@${id}>`).join(", ")}\n\n`;
    if (manual) desc += `🕒 Ostatnia synchronizacja ręczna: ${new Date().toLocaleTimeString()}\n\n`;
    if (added.length) desc += `✅ Przyznano role:\n${added.join("\n")}\n\n`;
    if (removed.length) desc += `⚠️ Odebrano role:\n${removed.join("\n")}\n\n`;
    if (!added.length && !removed.length) desc += "🔄 Brak zmian.";
    await statusMessage.edit({ embeds: [new EmbedBuilder().setTitle("Shadow Authority Log").setDescription(desc).setColor(0x800080).setTimestamp(new Date())] });
  }
};

// -------------------
// LOGI SOJUSZY
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
      reason: "Kanał logów sojuszy"
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

  for (const roleData of rolesDef) {
    let role = guild.roles.cache.find(r => r.name === roleData.name);
    if (!role) {
      await updateLogMessage(logChannel, `Tworzenie roli: ${roleData.name}`, alliance.logMessage);
      role = await guild.roles.create({ name: roleData.name, color: roleData.color, reason: `Sojusz ${name}` });
      await updateLogMessage(logChannel, `✅ Rola utworzona: ${roleData.name}`, alliance.logMessage);
      await delay(1000);
    }
    alliance.roles[roleData.name] = role.id;
  }

  let category = guild.channels.cache.find(c => c.name === `${name} • ${tag}` && c.type === ChannelType.GuildCategory);
  if (!category) {
    await updateLogMessage(logChannel, `Tworzenie kategorii: ${name} • ${tag}`, alliance.logMessage);
    category = await guild.channels.create({ name: `${name} • ${tag}`, type: ChannelType.GuildCategory });
    await updateLogMessage(logChannel, `📁 Kategoria utworzona: ${name} • ${tag}`, alliance.logMessage);
    alliance.category = category.id;
    await delay(1000);
  } else alliance.category = category.id;

  // Tworzenie kanałów
  const textChannels = ["👋 welcome","📢 announce","💬 chat","🛡 staff-room","✋ join"];
  for(const nameCh of textChannels){
    let ch = guild.channels.cache.find(c => c.name===nameCh && c.parentId===category.id) as TextChannel;
    if(!ch){
      await updateLogMessage(logChannel, `Tworzenie kanału tekstowego: ${nameCh}`, alliance.logMessage);
      ch = await guild.channels.create({name:nameCh, type:ChannelType.GuildText, parent:category.id});
      await updateLogMessage(logChannel, `💬 Text channel utworzony: ${nameCh}`, alliance.logMessage);
    }
    alliance.channels[nameCh] = ch.id;
    // nadanie permisji pozostaje takie samo
  }

  const voiceChannels = ["🎤 General VC","🎤 Staff VC"];
  for(const nameCh of voiceChannels){
    let ch = guild.channels.cache.find(c => c.name===nameCh && c.parentId===category.id) as VoiceChannel;
    if(!ch){
      await updateLogMessage(logChannel, `Tworzenie kanału głosowego: ${nameCh}`, alliance.logMessage);
      ch = await guild.channels.create({name:nameCh, type:ChannelType.GuildVoice, parent:category.id});
      await updateLogMessage(logChannel, `🔊 Voice channel utworzony: ${nameCh}`, alliance.logMessage);
    }
    alliance.channels[nameCh]=ch.id;
  }

  await updateLogMessage(logChannel, `🎉 Tworzenie sojuszu "${name} • ${tag}" zakończone!`, alliance.logMessage);
  setTimeout(()=>{alliance.logMessage?.delete().catch(()=>null)},10*60*1000);
};

// -------------------
// PSEUDODELETE
// -------------------
const pseudoDelete = async (guild: Guild, name: string, tag: string) => {
  if(!validateName(name) || !validateTag(tag)) return;
  const key = `${name}•${tag}`;
  const alliance = pseudoDB[key];
  if(!alliance) return;

  const shadowRole = guild.roles.cache.find(r=>r.name==="Shadow Authority");
  const logChannel = shadowRole ? await getAllianceLogChannel(guild, shadowRole.id) : undefined;
  if(!logChannel) return;

  if(!alliance.logMessage) alliance.logMessage=await updateLogMessage(logChannel, `📜 Rozpoczęto usuwanie sojuszu "${name} • ${tag}"`);

  // Usuwanie kanałów tekstowych i głosowych
  for(const chId of Object.values(alliance.channels)){
    const ch=guild.channels.cache.get(chId);
    if(ch){
      await updateLogMessage(logChannel, `Usuwanie kanału: ${ch.name}`,alliance.logMessage);
      await ch.delete();
      await updateLogMessage(logChannel, `🗑 Kanał usunięty: ${ch.name}`,alliance.logMessage);
      await delay(1000);
    }
  }

  // Usuwanie kategorii
  if(alliance.category){
    const category=guild.channels.cache.get(alliance.category);
    if(category){
      await updateLogMessage(logChannel, `Usuwanie kategorii: ${category.name}`,alliance.logMessage);
      // Usuń też kanały w kategorii, jeśli jakieś zostały
      const children = category.children.cache;
      for(const child of children.values()){
        await updateLogMessage(logChannel, `Usuwanie kanału z kategorii: ${child.name}`,alliance.logMessage);
        await child.delete();
        await updateLogMessage(logChannel, `🗑 Kanał usunięty: ${child.name}`,alliance.logMessage);
        await delay(1000);
      }
      await category.delete();
      await updateLogMessage(logChannel, `🗑 Kategoria usunięta: ${category.name}`,alliance.logMessage);
      await delay(1000);
    }
  }

  // Usuwanie ról
  for(const roleId of Object.values(alliance.roles)){
    const role=guild.roles.cache.get(roleId);
    if(role){
      await updateLogMessage(logChannel, `Usuwanie roli: ${role.name}`,alliance.logMessage);
      await role.delete();
      await updateLogMessage(logChannel, `🗑 Rola usunięta: ${role.name}`,alliance.logMessage);
      await delay(1000);
    }
  }

  await updateLogMessage(logChannel, `🗑 Usuwanie sojuszu "${name} • ${tag}" zakończone!`,alliance.logMessage);
  setTimeout(()=>{alliance.logMessage?.delete().catch(()=>null)},10*60*1000);

  delete pseudoDB[key];
};

// -------------------
// OBSŁUGA WIADOMOŚCI
// -------------------
client.on("messageCreate",async(message)=>{
  if(!message.guild||message.author.bot) return;
  if(message.guild.id!==GUILD_ID) return;

  const parts=message.content.trim().split(" ");
  const cmd=parts[0].toLowerCase();
  if(parts.length<3) return;

  const tag=parts.pop()!;
  const name=parts.slice(1).join(" ");
  if(!validateName(name)||!validateTag(tag)) return;

  if(cmd==="!create") await pseudoCreate(message.guild,name,tag);
  if(cmd==="!delete") await pseudoDelete(message.guild,name,tag);
});

// -------------------
// READY
// -------------------
client.once("ready",async()=>{
  logTime(`Zalogowano jako ${client.user?.tag}`);
  const guild=client.guilds.cache.get(GUILD_ID);
  if(!guild) return;

  const shadowSetup=await setupShadowAuthority(guild);
  if(shadowSetup){
    const {shadowRole,authorityIds,notifyChannel,statusMessage}=shadowSetup;
    setInterval(()=>synchronizeShadowAuthority(guild,shadowRole.id,authorityIds,notifyChannel,statusMessage),60_000);
  }
});

client.login(BOT_TOKEN);