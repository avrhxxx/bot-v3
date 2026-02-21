import { IntegrityMonitor } from "./system/snapshot/IntegrityMonitor";
import { Health } from "./system/Health";

console.log("System booting...");

Health.setHealthy();

// Start background integrity scan
IntegrityMonitor.start(15000);

console.log("Integrity Monitor started.");