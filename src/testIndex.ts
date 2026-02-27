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
// PSEUDOKOMENDA CREATE
// -------------------
const pseudoCreate = async (guild: Guild, name: string, tag: string) => {
  const key = `${name}•${tag}`;
  logTime(`🚀 Tworzenie sojuszu "${name}"`);

  if (!pseudoDB[key]) pseudoDB[key] = { roles: {}, channels: {} };

  const rolesDef = [
    { name: `R5[${tag}]`, color: 0xff0000 },
    { name: `R4[${tag}]`, color: 0x0000ff },
    { name: `R3[${tag}]`, color: 0x00ff00 },
    { name: `${name} • ${tag}`, color: 0xffff00 }
  ];

  for (const roleData of rolesDef) {
    let role = guild.roles.cache.find(r => r.name === roleData.name);
    if (!role) {
      role = await guild.roles.create({
        name: roleData.name,
        color: roleData.color,
        reason: `Testowy sojusz - ${name}`
      });
      logTime(`✅ Rola utworzona: ${roleData.name}`);
    } else {
      logTime(`⚠️ Rola już istnieje: ${roleData.name}`);
    }
    pseudoDB[key].roles[roleData.name] = role.id;
    await delay(1000);
  }

  // KATEGORIA
  let category = guild.channels.cache.find(
    c => c.name === `${name} • ${tag}` && c.type === ChannelType.GuildCategory
  ) as GuildBasedChannel | undefined;

  if (!category) {
    category = await guild.channels.create({
      name: `${name} • ${tag}`,
      type: ChannelType.GuildCategory
    });
    pseudoDB[key].category = category.id;
    logTime(`📁 Kategoria utworzona: ${name} • ${tag}`);
    await delay(1000);
  } else {
    pseudoDB[key].category = category.id;
    logTime(`⚠️ Kategoria już istnieje: ${name} • ${tag}`);
  }
  if (!category) return;

  // KANAŁY TEKSTOWE
  const textChannels = ["👋 welcome", "📢 announce", "💬 chat", "🛡 staff-room", "✋ join"];
  for (const nameCh of textChannels) {
    let ch = guild.channels.cache.find(c => c.name === nameCh && c.parentId === category!.id);

    if (!ch) {
      ch = await guild.channels.create({ name: nameCh, type: ChannelType.GuildText, parent: category.id });
      logTime(`💬 Text channel utworzony: ${nameCh}`);
    } else {
      logTime(`⚠️ Text channel już istnieje: ${nameCh}`);
    }
    pseudoDB[key].channels[nameCh] = ch.id;

    const overwrites: OverwriteResolvable[] = [];
    switch (nameCh) {
      case "👋 welcome":
      case "📢 announce":
        overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
        ["R3","R4","R5"].forEach(r => {
          const roleId = pseudoDB[key].roles[`${r}[${tag}]`];
          if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel] });
        });
        break;
      case "💬 chat":
        overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] });
        ["R3","R4","R5"].forEach(r => {
          const roleId = pseudoDB[key].roles[`${r}[${tag}]`];
          if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
        });
        break;
      case "🛡 staff-room":
        overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] });
        ["R4","R5"].forEach(r => {
          const roleId = pseudoDB[key].roles[`${r}[${tag}]`];
          if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
        });
        break;
      case "✋ join":
        overwrites.push({ id: guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel] });
        ["R3","R4","R5"].forEach(r => {
          const roleId = pseudoDB[key].roles[`${r}[${tag}]`];
          if (roleId) overwrites.push({ id: roleId, deny: [PermissionFlagsBits.ViewChannel] });
        });
        break;
    }

    if (ch) await (ch as any).permissionOverwrites.set(overwrites);
    await delay(500);
  }

  // KANAŁY GŁOSOWE
  const voiceChannels = ["🎤 General VC","🎤 Staff VC"];
  for (const nameCh of voiceChannels) {
    let ch = guild.channels.cache.find(c => c.name === nameCh && c.parentId === category!.id);

    if (!ch) {
      ch = await guild.channels.create({ name: nameCh, type: ChannelType.GuildVoice, parent: category.id });
      logTime(`🔊 Voice channel utworzony: ${nameCh}`);
    } else {
      logTime(`⚠️ Voice channel już istnieje: ${nameCh}`);
    }
    pseudoDB[key].channels[nameCh] = ch.id;

    const overwrites: OverwriteResolvable[] = [];
    overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] });

    const allowedRoles = nameCh === "🎤 Staff VC" ? ["R4","R5"] : ["R3","R4","R5"];
    allowedRoles.forEach(r => {
      const roleId = pseudoDB[key].roles[`${r}[${tag}]`];
      if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] });
    });

    if (ch) await (ch as any).permissionOverwrites.set(overwrites);
    await delay(500);
  }

  logTime(`🎉 Sojusz "${name} • ${tag}" w pełni utworzony!`);
};

// -------------------
// PSEUDOKOMENDA DELETE (poprawiona)
// -------------------
const pseudoDelete = async (guild: Guild, name: string, tag: string) => {
  const key = `${name}•${tag}`;
  const alliance = pseudoDB[key];
  if (!alliance) {
    logTime(`❌ Sojusz "${name} • ${tag}" nie istnieje`);
    return;
  }

  logTime(`🗑 Usuwanie sojuszu "${name}"`);

  // Usuń kanały
  for (const chId of Object.values(alliance.channels)) {
    const ch = guild.channels.cache.get(chId);
    if (ch) await ch.delete();
    logTime(`❌ Usunięto kanał: ${ch?.name}`);
    await delay(500);
  }

  // Usuń kategorię
  if (alliance.category) {
    const category = guild.channels.cache.get(alliance.category);
    if (category) await category.delete();
    logTime(`❌ Usunięto kategorię: ${category?.name}`);
    await delay(500);
  }

  // Usuń role
  for (const roleId of Object.values(alliance.roles)) {
    const role = guild.roles.cache.get(roleId);
    if (role) await role.delete();
    logTime(`❌ Usunięto rolę: ${role?.name}`);
    await delay(500);
  }

  delete pseudoDB[key];
  logTime(`✅ Sojusz "${name} • ${tag}" w pełni usunięty`);
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
      await message.reply("❌ Niepoprawna nazwa sojuszu. Dozwolone: A-Z, a-z, spacje, długość 4–32 znaki.");
      return;
    }
    if (!validateTag(tag)) {
      await message.reply("❌ Niepoprawny tag. Dozwolone: A-Z, a-z, 0-9, dokładnie 3 znaki.");
      return;
    }

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

    if (!validateName(name)) {
      await message.reply("❌ Niepoprawna nazwa sojuszu. Dozwolone: A-Z, a-z, spacje, długość 4–32 znaki.");
      return;
    }
    if (!validateTag(tag)) {
      await message.reply("❌ Niepoprawny tag. Dozwolone: A-Z, a-z, 0-9, dokładnie 3 znaki.");
      return;
    }

    await message.reply(`✅ Komenda !delete użyta — rozpoczęto usuwanie sojuszu "${name} • ${tag}" (testowo).`);
    await pseudoDelete(message.guild, name, tag);
  }
});

client.once("ready", () => {
  logTime(`Zalogowano jako ${client.user?.tag}`);
});

client.login(BOT_TOKEN);