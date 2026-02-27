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

    // ✅ TYLKO DLA TextChannel I VoiceChannel
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