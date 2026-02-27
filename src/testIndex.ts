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
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { BOT_TOKEN, GUILD_ID } from "./config/config";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// -------------------
// PSEUDOBAZA (multi-alliance + shadow authority)
// -------------------
const pseudoDB: Record<string, { roles: Record<string, string>; category?: string; channels: Record<string, string> }> = {};
const shadowDB: Record<string, string[]> = {}; // shadowRoleId -> userId[]
let shadowNotifyMessage: Message | null = null;

// -------------------
// CLIENT
// -------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
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
// SHADOW AUTHORITY
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

  const notifyChannel = guild.channels.cache.find(c => c.name === "shadow-authority-log" && c.type === ChannelType.GuildText) as TextChannel | undefined;
  if (!notifyChannel) {
    logTime(`⚠️ Nie znaleziono kanału 'shadow-authority-log'. Tworzę...`);
    const newCh = await guild.channels.create({
      name: "shadow-authority-log",
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }
      ]
    });
    logTime(`📁 Kanał do powiadomień utworzony: ${newCh.name}`);
  }

  // zainicjalizuj shadowDB
  if (!shadowDB[shadowRole.id]) shadowDB[shadowRole.id] = [];

  for (const userId of authorityIds) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) {
      logTime(`❌ Nie znaleziono użytkownika o ID: ${userId}`);
      continue;
    }
    if (!member.roles.cache.has(shadowRole.id)) {
      await member.roles.add(shadowRole);
      logTime(`✅ Przypisano rolę Shadow Authority do ${member.user.tag}`);
    }
    if (!shadowDB[shadowRole.id].includes(userId)) shadowDB[shadowRole.id].push(userId);
  }

  // stwórz wiadomość Embed do edycji
  const channel = guild.channels.cache.find(c => c.name === "shadow-authority-log" && c.type === ChannelType.GuildText) as TextChannel;
  if (channel) {
    const embed = new EmbedBuilder()
      .setTitle("Shadow Authority Sync")
      .setDescription(`Ostatnia synchronizacja: ${new Date().toLocaleString()}`)
      .setColor(0x800080);
    shadowNotifyMessage = await channel.send({ embeds: [embed] });
  }

  return { shadowRole, authorityIds, notifyChannel };
};

// -------------------
// FUNKCJA UPDATE POWIADOMIENIA
// -------------------
const updateShadowStatus = async (guild: Guild, shadowRoleId: string, lines: string[]) => {
  const channel = guild.channels.cache.find(c => c.name === "shadow-authority-log" && c.type === ChannelType.GuildText) as TextChannel;
  if (!channel) return;

  if (!shadowNotifyMessage) {
    const embed = new EmbedBuilder()
      .setTitle("Shadow Authority Sync")
      .setDescription(lines.join("\n"))
      .setColor(0x800080);
    shadowNotifyMessage = await channel.send({ embeds: [embed] });
  } else {
    const embed = new EmbedBuilder()
      .setTitle("Shadow Authority Sync")
      .setDescription(lines.join("\n"))
      .setColor(0x800080);
    await shadowNotifyMessage.edit({ embeds: [embed] });
  }
};

// -------------------
// EVENT LISTENER - REAKCJA NA ZMIANY ROLI
// -------------------
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  const shadowRoleId = Object.keys(shadowDB)[0];
  if (!shadowRoleId) return;

  const authorityIds = shadowDB[shadowRoleId] || [];
  const hadRoleBefore = oldMember.roles.cache.has(shadowRoleId);
  const hasRoleNow = newMember.roles.cache.has(shadowRoleId);

  if (hadRoleBefore && !hasRoleNow) {
    if (authorityIds.includes(newMember.id)) {
      await newMember.roles.add(shadowRoleId);
      logTime(`🔄 Przywrócono Shadow Authority użytkownikowi ${newMember.user.tag} (event)`);

      // aktualizacja pseudo-bazy
      if (!shadowDB[shadowRoleId].includes(newMember.id)) shadowDB[shadowRoleId].push(newMember.id);

      const timestamp = new Date().toLocaleTimeString();
      await updateShadowStatus(newMember.guild, shadowRoleId, [`🔄 Przywrócono rolę ${newMember.user.tag} o ${timestamp}`]);
    }
  }
});

// -------------------
// BACKUP SYNCHRONIZACJI (co 1 minutę)
// -------------------
const startShadowAuthoritySync = async (guild: Guild, shadowRoleId: string, authorityIds: string[]) => {
  setInterval(async () => {
    const changed: string[] = [];
    for (const userId of authorityIds) {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) continue;

      if (!member.roles.cache.has(shadowRoleId)) {
        await member.roles.add(shadowRoleId);
        changed.push(`${member.user.tag} przywrócono o ${new Date().toLocaleTimeString()}`);
        // aktualizacja pseudo-bazy
        if (!shadowDB[shadowRoleId].includes(userId)) shadowDB[shadowRoleId].push(userId);
      }
    }

    const lines = changed.length > 0
      ? changed
      : [`✅ Backup sync zakończony: ${new Date().toLocaleString()}`];

    await updateShadowStatus(guild, shadowRoleId, lines);
  }, 60_000); // 1 minuta
};

// -------------------
// PSEUDOKOMENDA CREATE
// -------------------
const pseudoCreate = async (guild: Guild, name: string, tag: string) => {
  await delay(5000); // krótki delay, blokada szybkich komend
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
    const exists = guild.channels.cache.find(c => c.name === nameCh && c.parentId === category.id);
    let ch = exists;
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

    if (ch) await ch.permissionOverwrites.set(overwrites);
    await delay(500);
  }

  const voiceChannels = ["🎤 General VC", "🎤 Staff VC"];
  for (const nameCh of voiceChannels) {
    const exists = guild.channels.cache.find(c => c.name === nameCh && c.parentId === category.id);
    let ch = exists;
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

    if (ch) await ch.permissionOverwrites.set(overwrites);
    await delay(500);
  }

  logTime(`🎉 Sojusz ${name} • ${tag} w pełni utworzony!`);
};

// -------------------
// PSEUDOKOMENDA DELETE
// -------------------
const pseudoDelete = async (guild: Guild, name: string, tag: string) => {
  await delay(5000); // krótki delay, blokada szybkich komend
  const key = `${name}•${tag}`;
  const alliance = pseudoDB[key];
  if (!alliance) {
    logTime(`❌ Sojusz "${name} • ${tag}" nie istnieje`);
    return;
  }

  // usuwanie kanałów i ról w kolejności odwrotnej
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
    const { shadowRole, authorityIds } = shadowSetup;
    startShadowAuthoritySync(guild, shadowRole.id, authorityIds);
  }
});

client.login(BOT_TOKEN);