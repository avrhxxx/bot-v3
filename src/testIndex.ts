// src/testIndex.ts
import { Client, GatewayIntentBits, Guild, PermissionFlagsBits, OverwriteType } from "discord.js";
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
    const rolesData = [
      { name: `R5[${TEST_ALLIANCE_TAG}]`, color: "#FF0000" }, // czerwony
      { name: `R4[${TEST_ALLIANCE_TAG}]`, color: "#0000FF" }, // niebieski
      { name: `R3[${TEST_ALLIANCE_TAG}]`, color: "#00FF00" }, // zielony
      { name: TEST_ALLIANCE_NAME, color: "#FFFF00" } // rola tożsamościowa
    ];

    const createdRoles: Record<string, string> = {};

    for (const { name, color } of rolesData) {
      let role = guild.roles.cache.find(r => r.name === name);
      if (!role) {
        role = await guild.roles.create({ name, color, reason: `Tworzenie roli dla ${TEST_ALLIANCE_NAME}` });
        console.log(`✅ Stworzono rolę: ${name}`);
      } else {
        console.log(`Rola ${name} już istnieje`);
      }
      createdRoles[name] = role.id;
      await delay(3000); // 3 sekundy między rolami
    }

    // --------------------------
    // 2️⃣ Tworzenie kategorii
    // --------------------------
    let category = guild.channels.cache.find(c => c.name === TEST_ALLIANCE_NAME && c.type === 4);
    if (!category) {
      category = await guild.channels.create({ name: TEST_ALLIANCE_NAME, type: 4 });
      console.log(`✅ Stworzono kategorię: ${TEST_ALLIANCE_NAME}`);
    } else {
      console.log(`Kategoria ${TEST_ALLIANCE_NAME} już istnieje`);
    }

    await delay(5000); // 5 sekund przed startem kanałów

    // --------------------------
    // 3️⃣ Tworzenie kanałów tekstowych i głosowych
    // --------------------------
    const textChannels = [
      { name: "👋 welcome", perms: [createdRoles[`R5[${TEST_ALLIANCE_TAG}]`], createdRoles[`R4[${TEST_ALLIANCE_TAG}]`], createdRoles[`R3[${TEST_ALLIANCE_TAG}]`]], botWriteOnly: true },
      { name: "📢 announce", perms: [createdRoles[`R5[${TEST_ALLIANCE_TAG}]`], createdRoles[`R4[${TEST_ALLIANCE_TAG}]`], createdRoles[`R3[${TEST_ALLIANCE_TAG}]`]], botWriteOnly: true },
      { name: "💬 chat", perms: [createdRoles[`R5[${TEST_ALLIANCE_TAG}]`], createdRoles[`R4[${TEST_ALLIANCE_TAG}]`], createdRoles[`R3[${TEST_ALLIANCE_TAG}]`]] },
      { name: "🛡 staff-room", perms: [createdRoles[`R5[${TEST_ALLIANCE_TAG}]`], createdRoles[`R4[${TEST_ALLIANCE_TAG}]`]] },
      { name: "✋ join", perms: [] } // widoczny dla wszystkich poza R3/R4/R5
    ];

    for (const { name, perms, botWriteOnly } of textChannels) {
      let ch = guild.channels.cache.find(c => c.name === name && c.parentId === category.id);
      if (!ch) {
        ch = await guild.channels.create({ name, type: 0, parent: category.id });
        console.log(`✅ Stworzono kanał tekstowy: ${name}`);
      } else {
        console.log(`Kanał tekstowy ${name} już istnieje`);
      }

      // --------------------------
      // 4️⃣ Ustawienie permisji
      // --------------------------
      for (const roleId of perms) {
        await ch.permissionOverwrites.edit(roleId, { ViewChannel: true, SendMessages: !botWriteOnly });
      }
      // bot zawsze może pisać
      await ch.permissionOverwrites.edit(client.user!.id, { ViewChannel: true, SendMessages: true });
      // ukryj dla wszystkich pozostałych
      await ch.permissionOverwrites.edit(guild.roles.everyone.id, { ViewChannel: perms.length > 0 ? false : true, SendMessages: false });

      await delay(2000); // 2 sekundy między ustawieniem permisji
      await delay(4000); // 4 sekundy między kanałami
    }

    const voiceChannels = [
      { name: "🎤 General VC", perms: [createdRoles[`R5[${TEST_ALLIANCE_TAG}]`], createdRoles[`R4[${TEST_ALLIANCE_TAG}]`], createdRoles[`R3[${TEST_ALLIANCE_TAG}]`]] },
      { name: "🎤 Staff VC", perms: [createdRoles[`R5[${TEST_ALLIANCE_TAG}]`], createdRoles[`R4[${TEST_ALLIANCE_TAG}]`]] }
    ];

    for (const { name, perms } of voiceChannels) {
      let ch = guild.channels.cache.find(c => c.name === name && c.parentId === category.id);
      if (!ch) {
        ch = await guild.channels.create({ name, type: 2, parent: category.id });
        console.log(`✅ Stworzono kanał głosowy: ${name}`);
      } else {
        console.log(`Kanał głosowy ${name} już istnieje`);
      }

      for (const roleId of perms) {
        await ch.permissionOverwrites.edit(roleId, { ViewChannel: true, Connect: true, Speak: true });
      }
      // bot też może wejść
      await ch.permissionOverwrites.edit(client.user!.id, { ViewChannel: true, Connect: true, Speak: true });
      // ukryj dla everyone
      await ch.permissionOverwrites.edit(guild.roles.everyone.id, { ViewChannel: false });

      await delay(2000); // 2 sekundy między ustawieniem permisji
      await delay(4000); // 4 sekundy między kanałami
    }

    console.log("🎉 Testowy sojusz został w pełni utworzony z rolami, kanałami i permisjami!");
  } catch (err) {
    console.error("❌ Błąd podczas tworzenia testowego sojuszu:", err);
  }
});

// Logowanie bota
client.login(BOT_TOKEN).catch(err => {
  console.error("Nie udało się zalogować testowego bota:", err);
});