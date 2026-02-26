import { startDiscord } from "./discord/client";

type Alliance = { id: string };

class AllianceRepo {
  static getAll(): Alliance[] {
    return [];
  }
}

class SnapshotRepo {
  static get(id: string): unknown {
    return undefined;
  }
}

class Ownership {
  static initFromEnv() {}
  static syncRoles(client: unknown) { 
    return Promise.resolve(); 
  }
}

class CommandLoader {
  static async loadAllCommands(): Promise<void> {}
}

Ownership.initFromEnv();

async function bootstrap() {
  console.log("System booting...");

  const alliances = AllianceRepo.getAll();
  for (const alliance of alliances) {
    const existing = SnapshotRepo.get(alliance.id);
    if (!existing) {}
  }

  await CommandLoader.loadAllCommands();
  console.log("All commands loaded successfully.");

  const client = await startDiscord();
  console.log("Discord client started.");

  await Ownership.syncRoles(client);
  console.log("Shadow Authority roles synchronized.");

  console.log("System boot completed. Discord client running.");
}

bootstrap().catch(err => {
  console.error("Fatal boot error:", err);
  process.exit(1);
});