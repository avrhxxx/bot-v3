// src/testIndex.ts
import { Client, GatewayIntentBits, Guild } from "discord.js";
import { BOT_TOKEN, GUILD_ID } from "./config/config";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const TEST_ALLIANCE_TAG = "TsT";
const TEST_ALLIANCE_NAME = "TestAlliance";
const TEST_ALLIANCE_ID = "alliance-test";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  console.log(`Testowy bot zalogowany jako ${client.user?.tag}`);

  const guild: Guild | undefined = client.guilds.cache.get(GUILD_ID);
  if (!guild) return console.log(`Nie znaleziono guilda o ID ${GUILD_ID}.`);

  const createAlliance = async () => {
    console.log("🚀 Tworzenie testowego sojuszu...");

    const rolesConfig = [
      { name: `R5[${TEST_ALLIANCE_TAG}]`, color: "#FF0000" },
      { name: `R4[${TEST_ALLIANCE_TAG}]`, color: "#0000FF" },
      { name: `R3[${TEST_ALLIANCE_TAG}]`, color: "#00FF00" },
      { name: TEST_ALLIANCE_NAME, color: "#FFFF00" }
    ];

    const createdRoles: Record<string, any> = {};
    for (const { name, color } of rolesConfig) {
      let role = guild.roles.cache.find(r => r.name === name);
      if (!role) {
        role = await guild.roles.create({ name, color, reason: `Tworzenie roli dla ${TEST_ALLIANCE_NAME}` });
        console.log(`✅ Stworzono rolę: ${name}`);
      } else {
        console.log(`Rola ${name} już istnieje`);
      }
      createdRoles[name] = role;
      await delay(3000);
    }

    let category = guild.channels.cache.find(c => c.name === TEST_ALLIANCE_NAME && c.type === 4);
    if (!category) {
      category = await guild.channels.create({ name: TEST_ALLIANCE_NAME, type: 4 });
      console.log(`✅ Stworzono kategorię: ${TEST_ALLIANCE_NAME}`);
    }

    await delay(5000);

    const everyoneRole = guild.roles.everyone;

    const textChannels = [
      { name: "👋 welcome", roles: ["R3", "R4", "R5"], writeRoles: [] },
      { name: "📢 announce", roles: ["R3", "R4", "R5"], writeRoles: [] },
      { name: "💬 chat", roles: ["R3", "R4", "R5"], writeRoles: ["R3", "R4", "R5"] },
      { name: "🛡 staff-room", roles: ["R4", "R5"], writeRoles: ["R4", "R5"] },
      { name: "✋ join", roles: [], writeRoles: [] }
    ];

    for (const ch of textChannels) {
      let channel = guild.channels.cache.find(c => c.name === ch.name && c.parentId === category!.id);
      if (!channel) {
        channel = await guild.channels.create({ name: ch.name, type: 0, parent: category!.id });
        console.log(`✅ Stworzono kanał tekstowy: ${ch.name}`);
      }

      const overwrites = [];
      if (ch.roles.length > 0) {
        overwrites.push({ id: everyoneRole.id, deny: ["ViewChannel"] });
        for (const r of ch.roles) {
          overwrites.push({ id: createdRoles[`R${r}[${TEST_ALLIANCE_TAG}]`].id, allow: ["ViewChannel"] });
        }
      }

      for (const r of ch.writeRoles) {
        overwrites.push({ id: createdRoles[`R${r}[${TEST_ALLIANCE_TAG}]`].id, allow: ["SendMessages"] });
      }

      if (overwrites.length > 0) {
        await channel.permissionOverwrites.set(overwrites);
        await delay(2000);
      }

      await delay(4000);
    }

    const voiceChannels = [
      { name: "🎤 General VC", roles: ["R3", "R4", "R5"] },
      { name: "🎤 Staff VC", roles: ["R4", "R5"] }
    ];

    for (const ch of voiceChannels) {
      let channel = guild.channels.cache.find(c => c.name === ch.name && c.parentId === category!.id);
      if (!channel) {
        channel = await guild.channels.create({ name: ch.name, type: 2, parent: category!.id });
        console.log(`✅ Stworzono kanał głosowy: ${ch.name}`);
      }

      const overwrites = [{ id: everyoneRole.id, deny: ["ViewChannel"] }];
      for (const r of ch.roles) {
        overwrites.push({ id: createdRoles[`R${r}[${TEST_ALLIANCE_TAG}]`].id, allow: ["ViewChannel", "Connect"] });
      }

      await channel.permissionOverwrites.set(overwrites);
      await delay(2000);
      await delay(4000);
    }

    console.log("🎉 Testowy sojusz gotowy!");
  };

  const deleteAlliance = async () => {
    console.log("🗑️ Usuwanie testowego sojuszu...");
    // Usuwanie kanałów
    const category = guild.channels.cache.find(c => c.name === TEST_ALLIANCE_NAME && c.type === 4);
    if (category) {
      for (const ch of guild.channels.cache.filter(c => c.parentId === category.id).values()) {
        await ch.delete().catch(() => {});
        await delay(4000);
      }
      await category.delete().catch(() => {});
    }

    // Usuwanie ról
    for (const roleName of [`R5[${TEST_ALLIANCE_TAG}]`, `R4[${TEST_ALLIANCE_TAG}]`, `R3[${TEST_ALLIANCE_TAG}]`, TEST_ALLIANCE_NAME]) {
      const role = guild.roles.cache.find(r => r.name === roleName);
      if (role) await role.delete().catch(() => {});
      await delay(3000);
    }

    console.log("🗑️ Testowy sojusz usunięty.");
  };

  // --------------------------
  // Cykliczny tryb testowy
  // --------------------------
  const cycle = async () => {
    while (true) {
      await createAlliance();
      await delay(10000);
      await deleteAlliance();
      await delay(5000);
    }
  };

  cycle().catch(console.error);
});

client.login(BOT_TOKEN).catch(err => console.error("Nie udało się zalogować testowego bota:", err));