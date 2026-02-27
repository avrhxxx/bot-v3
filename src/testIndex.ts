// src/testIndex.ts
import {
  Client,
  GatewayIntentBits,
  Guild,
  ChannelType,
  Role,
  OverwriteResolvable,
  PermissionFlagsBits,
  Message
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
// PSEUDOKOMENDA CREATE
// -------------------
const pseudoCreate = async (guild: Guild) => {
  logTime(`🚀 Pseudokomenda: Tworzenie sojuszu "${TEST_ALLIANCE.name}"`);

  // 1️⃣ ROLE
  const rolesDef = [
    { name: `R5[${TEST_ALLIANCE.tag}]`, color: 0xff0000 },
    { name: `R4[${TEST_ALLIANCE.tag}]`, color: 0x0000ff },
    { name: `R3[${TEST_ALLIANCE.tag}]`, color: 0x00ff00 },
    { name: TEST_ALLIANCE.name, color: 0xffff00 }
  ];

  const createdRoles: Record<string, Role> = {};

  for (const roleData of rolesDef) {
    let role = guild.roles.cache.find(r => r.name === roleData.name);

    if (!role) {
      role = await guild.roles.create({
        name: roleData.name,
        color: roleData.color,
        reason: `Testowy sojusz - ${TEST_ALLIANCE.name}`
      });
      logTime(`✅ Rola utworzona: ${roleData.name}`);
    } else {
      logTime(`⚠️ Rola już istnieje: ${roleData.name}`);
    }

    createdRoles[roleData.name] = role;
    pseudoDB.roles[roleData.name] = role.id;
    await delay(3000);
  }

  // 2️⃣ KATEGORIA
  let category = guild.channels.cache.find(
    c => c.name === TEST_ALLIANCE.name && c.type === ChannelType.GuildCategory
  );

  if (!category) {
    category = await guild.channels.create({
      name: TEST_ALLIANCE.name,
      type: ChannelType.GuildCategory
    });
    pseudoDB.category = category.id;
    logTime(`📁 Kategoria utworzona: ${TEST_ALLIANCE.name}`);
    await delay(5000);
  } else {
    pseudoDB.category = category.id;
    logTime(`⚠️ Kategoria już istnieje: ${TEST_ALLIANCE.name}`);
  }

  if (!category) return;

  // 3️⃣ KANAŁY TEKSTOWE
  const textChannels = ["👋 welcome", "📢 announce", "💬 chat", "🛡 staff-room", "✋ join"];

  for (const name of textChannels) {
    const exists = guild.channels.cache.find(
      c => c.name === name && c.parentId === category!.id
    );

    let ch;
    if (!exists) {
      ch = await guild.channels.create({
        name,
        type: ChannelType.GuildText,
        parent: category.id
      });
      logTime(`💬 Text channel utworzony: ${name}`);
    } else {
      ch = exists;
      logTime(`⚠️ Text channel już istnieje: ${name}`);
    }

    pseudoDB.channels[name] = ch.id;

    // -------------------
    // PERMISSIONS DWUWARSTWOWE
    // -------------------
    const overwrites: OverwriteResolvable[] = [];

    if (name !== "👋 welcome" && name !== "✋ join") {
      overwrites.push({
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      });
    }

    switch (name) {
      case "👋 welcome":
      case "📢 announce":
      case "💬 chat":
        ["R3","R4","R5"].forEach(r => {
          const roleId = pseudoDB.roles[`${r}[${TEST_ALLIANCE.tag}]`];
          if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel] });
        });
        break;
      case "🛡 staff-room":
        ["R4","R5"].forEach(r => {
          const roleId = pseudoDB.roles[`${r}[${TEST_ALLIANCE.tag}]`];
          if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
        });
        break;
      case "💬 chat":
        ["R3","R4","R5"].forEach(r => {
          const roleId = pseudoDB.roles[`${r}[${TEST_ALLIANCE.tag}]`];
          if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.SendMessages] });
        });
        break;
      case "✋ join":
        break;
    }

    // ✅ tylko jeśli kanał jest text lub voice
    if (ch && (ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildVoice)) {
      await ch.permissionOverwrites.set(overwrites);
    }

    await delay(2000);
  }

  // 4️⃣ KANAŁY GŁOSOWE
  const voiceChannels = ["🎤 General VC","🎤 Staff VC"];

  for (const name of voiceChannels) {
    const exists = guild.channels.cache.find(
      c => c.name === name && c.parentId === category!.id
    );

    let ch;
    if (!exists) {
      ch = await guild.channels.create({
        name,
        type: ChannelType.GuildVoice,
        parent: category.id
      });
      logTime(`🔊 Voice channel utworzony: ${name}`);
    } else {
      ch = exists;
      logTime(`⚠️ Voice channel już istnieje: ${name}`);
    }

    pseudoDB.channels[name] = ch.id;

    const overwrites: OverwriteResolvable[] = [];
    if (name === "🎤 Staff VC") ["R4","R5"].forEach(r => {
      const roleId = pseudoDB.roles[`${r}[${TEST_ALLIANCE.tag}]`];
      if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] });
    });
    if (name === "🎤 General VC") ["R3","R4","R5"].forEach(r => {
      const roleId = pseudoDB.roles[`${r}[${TEST_ALLIANCE.tag}]`];
      if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] });
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

  // 1️⃣ Usuwanie kanałów
  for (const chId of Object.values(pseudoDB.channels)) {
    const ch = guild.channels.cache.get(chId);
    if (ch) await ch.delete();
    logTime(`❌ Usunięto kanał: ${ch?.name}`);
    await delay(1000);
  }
  pseudoDB.channels = {};

  // 2️⃣ Usuwanie kategorii
  if (pseudoDB.category) {
    const category = guild.channels.cache.get(pseudoDB.category);
    if (category) await category.delete();
    logTime(`❌ Usunięto kategorię: ${category?.name}`);
    await delay(1000);
    pseudoDB.category = undefined;
  }

  // 3️⃣ Usuwanie ról
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

  if (message.content === "!create") await pseudoCreate(message.guild);
  if (message.content === "!delete") await pseudoDelete(message.guild);
});

client.once("ready", () => {
  logTime(`Zalogowano jako ${client.user?.tag}`);
});

client.login(BOT_TOKEN);