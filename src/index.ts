import { startDiscord, ClientStub } from "./discord/client";
import { CommandLoader } from "./system/CommandLoader";

// Repos
type Alliance = { id: string };

class AllianceRepo {
  static getAll(): Alliance[] {
    return [{ id: "ally1" }, { id: "ally2" }];
  }
}

class SnapshotRepo {
  static get(id: string): Record<string, any> | undefined {
    return undefined;
  }
}

class Ownership {
  static initFromEnv() {}
  static syncRoles(client: ClientStub): Promise<void> {
    console.log("Syncing roles with client stub...");
    return Promise.resolve();
  }
}

// Inicjalizacja
Ownership.initFromEnv();

async function bootstrap() {
  console.log("System booting...");

  const alliances = AllianceRepo.getAll();
  for (const alliance of alliances) {
    const existing = SnapshotRepo.get(alliance.id);
    if (!existing) {
      console.log(`Snapshot missing for alliance ${alliance.id}`);
    }
  }

  await CommandLoader.loadAllCommands();
  console.log("All commands loaded successfully.");

  const client = await startDiscord();
  console.log("Discord client started.");

  await Ownership.syncRoles(client);
  console.log("Shadow Authority roles synchronized.");

  console.log("System boot completed. Discord client running.");
}

// Global error handling
process.on("unhandledRejection", (reason) => console.error("Unhandled Rejection:", reason));
process.on("uncaughtException", (err) => console.error("Uncaught Exception:", err));

bootstrap().catch(err => {
  console.error("Fatal boot error:", err);
  process.exit(1);
});