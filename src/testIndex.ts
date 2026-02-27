// src/testIndex.ts
import {
  Client,
  GatewayIntentBits,
  Guild,
  ChannelType,
  Role,
  OverwriteResolvable,
  PermissionFlagsBits
} from "discord.js";
import { BOT_TOKEN, GUILD_ID } from "./config/config";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const TEST_ALLIANCE = { tag: "CEL", name: "Behemoth Cells" };

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
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
  logTime(`🚀 Tworzenie sojuszu: ${TEST_ALLIANCE.name}`);

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
    logTime(`📁 Kategoria utworzona: ${TEST_ALLIANCE.name}`);
    await delay(5000);
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

    // Permissions dwuwarstwowe
    const overwrites: OverwriteResolvable[] = [];

    // everyone deny
    if (name !== "👋 welcome" && name !== "✋ join") {
      overwrites.push({
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      });
    }

    // role allow
    switch (name) {
      case "👋 welcome":
      case "📢 announce":
      case "💬 chat":
        ["R3", "R4", "R5"].forEach(r => {
          const role = createdRoles[`${r}[${TEST_ALLIANCE.tag}]`];
          if (role) overwrites.push({
            id: role.id,
            allow: [PermissionFlagsBits.ViewChannel]
          });
        });
        break;
      case "🛡 staff-room":
        ["R4", "R5"].forEach(r => {
          const role = createdRoles[`${r}[${TEST_ALLIANCE.tag}]`];
          if (role) overwrites.push({
            id: role.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
          });
        });
        break;
      case "💬 chat":
        ["R3", "R4", "R5"].forEach(r => {
          const role = createdRoles[`${r}[${TEST_ALLIANCE.tag}]`];
          if (role) overwrites.push({
            id: role.id,
            allow: [PermissionFlagsBits.SendMessages]
          });
        });
        break;
      case "✋ join":
        // visible dla wszystkich poza R3,R4,R5
        break;
    }

    if (ch) await ch.permissionOverwrites.set(overwrites);
    await delay(2000);
  }

  // 4️⃣ KANAŁY GŁOSOWE
  const voiceChannels = ["🎤 General VC", "🎤 Staff VC"];

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

    const overwrites: OverwriteResolvable[] = [];
    if (name === "🎤 Staff VC") {
      ["R4", "R5"].forEach(r => {
        const role = createdRoles[`${r}[${TEST_ALLIANCE.tag}]`];
        if (role) overwrites.push({
          id: role.id,
          allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
        });
      });
    } else if (name === "🎤 General VC") {
      ["R3", "R4", "R5"].forEach(r => {
        const role = createdRoles[`${r}[${TEST_ALLIANCE.tag}]`];
        if (role) overwrites.push({
          id: role.id,
          allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
        });
      });
    }

    if (ch) await ch.permissionOverwrites.set(overwrites);
    await delay(2000);
  }

  logTime("🎉 Sojusz w pełni utworzony!");
};

// -------------------
// PSEUDOKOMENDA DELETE
// -------------------
const pseudoDelete = async (guild: Guild) => {
  logTime(`🗑 Usuwanie sojuszu: ${TEST_ALLIANCE.name}`);

  const category = guild.channels.cache.find(
    c => c.name === TEST_ALLIANCE.name && c.type === ChannelType.GuildCategory
  );

  if (category && category.type === ChannelType.GuildCategory) {
    for (const ch of category.children.cache.values()) {
      await ch.delete();
      logTime(`❌ Usunięto kanał: ${ch.name}`);
      await delay(1000);
    }

    await category.delete();
    logTime(`❌ Usunięto kategorię: ${TEST_ALLIANCE.name}`);
    await delay(1000);
  }

  const roleNames = [
    `R5[${TEST_ALLIANCE.tag}]`,
    `R4[${TEST_ALLIANCE.tag}]`,
    `R3[${TEST_ALLIANCE.tag}]`,
    TEST_ALLIANCE.name
  ];

  for (const name of roleNames) {
    const role = guild.roles.cache.find(r => r.name === name);
    if (role) {
      await role.delete();
      logTime(`❌ Usunięto rolę: ${name}`);
      await delay(1000);
    }
  }

  logTime(`✅ Sojusz ${TEST_ALLIANCE.name} w pełni usunięty`);
};

// -------------------
// WYWOŁANIE PSEUDOKOMEND (tylko dla testów)
// -------------------
client.once("ready", async () => {
  const guild: Guild | undefined = client.guilds.cache.get(GUILD_ID);
  if (!guild) return;

  // przykładowe wywołania do testu:
  // await pseudoCreate(guild);
  // await pseudoDelete(guild);
});

client.login(BOT_TOKEN);