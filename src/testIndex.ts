// src/testIndex.ts
import { Client, GatewayIntentBits, Guild } from "discord.js";
import { BOT_TOKEN, GUILD_ID } from "./config/config";

// Funkcja delay w ms
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Testowy sojusz
const TEST_ALLIANCE_TAG = "TsT";
const TEST_ALLIANCE_NAME = "TestAlliance";
const TEST_ALLIANCE_ID = "alliance-test";

// Tworzymy klienta Discord
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  console.log(`Testowy bot zalogowany jako ${client.user?.tag}`);

  const guild: Guild | undefined = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    console.log(`Nie znaleziono guilda o ID ${GUILD_ID}.`);
    return;
  }

  try {
    console.log("🚀 Rozpoczynamy tworzenie testowego sojuszu...");

    // --------------------------
    // 1️⃣ Tworzenie ról
    // --------------------------
    const roles = [
      { name: `R5[${TEST_ALLIANCE_TAG}]`, color: "#FF0000" },
      { name: `R4[${TEST_ALLIANCE_TAG}]`, color: "#0000FF" },
      { name: `R3[${TEST_ALLIANCE_TAG}]`, color: "#00FF00" },
      { name: TEST_ALLIANCE_NAME, color: "#FFFF00" } // rola tożsamościowa
    ];

    const createdRoles: Record<string, any> = {};

    for (const { name, color } of roles) {
      let role = guild.roles.cache.find(r => r.name === name);
      if (!role) {
        role = await guild.roles.create({ name, color, reason: `Tworzenie roli dla ${TEST_ALLIANCE_NAME}` });
        console.log(`✅ Stworzono rolę: ${name}`);
      } else {
        console.log(`Rola ${name} już istnieje`);
      }
      createdRoles[name] = role;
      await delay(3000); // 3 sekundy między rolami
    }

    // --------------------------
    // 2️⃣ Tworzenie kategorii
    // --------------------------
    let category = guild.channels.cache.find(c => c.name === TEST_ALLIANCE_NAME && c.type === 4); // 4 = CategoryChannel
    if (!category) {
      category = await guild.channels.create({ name: TEST_ALLIANCE_NAME, type: 4 });
      console.log(`✅ Stworzono kategorię: ${TEST_ALLIANCE_NAME}`);
    } else {
      console.log(`Kategoria ${TEST_ALLIANCE_NAME} już istnieje`);
    }

    await delay(5000); // 5 sekund pauzy przed kanałami

    // --------------------------
    // 3️⃣ Tworzenie i ustawianie kanałów z permisjami
    // --------------------------
    const everyoneRole = guild.roles.everyone;

    const textChannels = [
      { name: "👋 welcome", roles: ["R3", "R4", "R5"], writeRoles: [] },
      { name: "📢 announce", roles: ["R3", "R4", "R5"], writeRoles: [] },
      { name: "💬 chat", roles: ["R3", "R4", "R5"], writeRoles: ["R3", "R4", "R5"] },
      { name: "🛡 staff-room", roles: ["R4", "R5"], writeRoles: ["R4", "R5"] },
      { name: "✋ join", roles: [], writeRoles: [] } // widoczny dla wszystkich, nie dla sojuszników
    ];

    for (const ch of textChannels) {
      let channel = guild.channels.cache.find(c => c.name === ch.name && c.parentId === category.id);
      if (!channel) {
        channel = await guild.channels.create({ name: ch.name, type: 0, parent: category.id }); // 0 = GuildText
        console.log(`✅ Stworzono kanał tekstowy: ${ch.name}`);
      }

      // ---- Ustawienie permisji ----
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
        await delay(2000); // 2 sekundy między ustawianiem permisji
      }

      await delay(4000); // 4 sekundy między kanałami
    }

    const voiceChannels = [
      { name: "🎤 General VC", roles: ["R3", "R4", "R5"] },
      { name: "🎤 Staff VC", roles: ["R4", "R5"] }
    ];

    for (const ch of voiceChannels) {
      let channel = guild.channels.cache.find(c => c.name === ch.name && c.parentId === category.id);
      if (!channel) {
        channel = await guild.channels.create({ name: ch.name, type: 2, parent: category.id }); // 2 = GuildVoice
        console.log(`✅ Stworzono kanał głosowy: ${ch.name}`);
      }

      // ---- Ustawienie permisji ----
      const overwrites = [{ id: everyoneRole.id, deny: ["ViewChannel"] }];
      for (const r of ch.roles) {
        overwrites.push({ id: createdRoles[`R${r}[${TEST_ALLIANCE_TAG}]`].id, allow: ["ViewChannel", "Connect"] });
      }

      await channel.permissionOverwrites.set(overwrites);
      await delay(2000); // 2 sekundy między ustawianiem permisji

      await delay(4000); // 4 sekundy między kanałami
    }

    console.log("🎉 Testowy sojusz został w pełni utworzony w trybie krokowym z permisjami!");
  } catch (err) {
    console.error("❌ Błąd podczas tworzenia testowego sojuszu:", err);
  }
});

// Logowanie bota
client.login(BOT_TOKEN).catch(err => {
  console.error("Nie udało się zalogować testowego bota:", err);
});