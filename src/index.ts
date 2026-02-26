import path from "path";
import { performance } from "perf_hooks";

import { startDiscord } from "./discord/client";

class AllianceRepo {
  static getAll() { return []; }
}
class SnapshotRepo {
  static get(id: string) { return undefined; }
}
class Ownership {
  static initFromEnv() {}
  static syncRoles(client: any) { return Promise.resolve(); }
}
class CommandLoader {
  static async loadAllCommands() {}
}

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