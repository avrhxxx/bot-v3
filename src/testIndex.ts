      await updateLogMessage(logChannel, `Usuwanie kategorii: ${category.name}`, alliance.logMessage);
      await category.delete();
      await updateLogMessage(logChannel, `🗑 Kategoria usunięta: ${category.name}`, alliance.logMessage);
      await delay(1000);
    }
  }

  for (const roleId of Object.values(alliance.roles)) {
    const role = guild.roles.cache.get(roleId);
    if (role) {
      await updateLogMessage(logChannel, `Usuwanie roli: ${role.name}`, alliance.logMessage);
      await role.delete();
      await updateLogMessage(logChannel, `🗑 Rola usunięta: ${role.name}`, alliance.logMessage);
      await delay(1000);
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
    const { shadowRole, authorityIds, notifyChannel, statusMessage } = shadowSetup;
    // Automatyczna synchronizacja co minutę
    setInterval(() => synchronizeShadowAuthority(guild, shadowRole.id, authorityIds, notifyChannel, statusMessage), 60_000);
  }
});

client.login(BOT_TOKEN);