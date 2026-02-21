console.log("THIS IS NEW BUILD 123");

import { IntegrityMonitor } from "./system/snapshot/IntegrityMonitor";
import { Health } from "./system/Health";
import { startDiscord } from "./discord/client";

console.log("System booting...");

Health.setHealthy();

IntegrityMonitor.start(15000);

startDiscord();

console.log("Integrity Monitor started.");