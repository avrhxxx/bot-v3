/**
 * ============================================
 * FILE: src/system/alliance/SystemInitializer.ts
 * LAYER: SYSTEM (Alliance Initialization & Background Tasks)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Inicjalizacja wszystkich modułów systemu sojuszy
 * - Synchronizacja ról i kanałów Discord
 * - Ładowanie komend systemowych i użytkownika
 * - Walidacja spójności sojuszy
 * - Uruchomienie zadań w tle (rollback liderów, backupy)
 *
 * ZALEŻNOŚCI:
 * - AllianceService (load, validate)
 * - MembershipModule, RoleModule, ChannelModule, BroadcastModule
 * - TransferLeaderSystem (orphan rollback)
 * - MutationGate (locki i atomowe operacje)
 * - CommandLoader (dynamiczne ładowanie komend)
 *
 * UWAGA:
 * - Wszystkie mutacje danych wymagają MutationGate
 * - startBackgroundTasks uruchamia interwały w tle, które muszą obsługiwać błędy
 *
 * ============================================
 */

import { AllianceService } from "../AllianceService";
import { MembershipModule } from "./modules/membership/MembershipModule";
import { RoleModule } from "./modules/role/RoleModule";
import { ChannelModule } from "./modules/channel/ChannelModule";
import { BroadcastModule } from "./modules/broadcast/BroadcastModule";
import { TransferLeaderSystem } from "../TransferLeaderSystem";
import { MutationGate } from "../../engine/MutationGate";
import { CommandLoader } from "../../commands/loader/CommandLoader";

export class SystemInitializer {
  /**
   * Inicjalizacja wszystkich modułów i komend systemu
   */
  static async init() {
    // 1️⃣ Inicjalizacja atomowych locków
    await MutationGate.initLocks();

    // 2️⃣ Załadowanie danych z repozytoriów
    if (AllianceService.loadAllAlliances) {
      await AllianceService.loadAllAlliances();
    }

    // 3️⃣ Synchronizacja ról i kanałów z Discord
    if (RoleModule.syncAllRoles) await RoleModule.syncAllRoles();
    if (ChannelModule.syncAllChannels) await ChannelModule.syncAllChannels();

    // 4️⃣ Ładowanie wszystkich komend (system + użytkownik)
    if (CommandLoader.loadAllCommands) await CommandLoader.loadAllCommands();

    // 5️⃣ Walidacja spójności wszystkich sojuszy
    if (AllianceService.validateAll) await AllianceService.validateAll();

    // 6️⃣ Start zadań w tle (rollback liderów, backupy)
    SystemInitializer.startBackgroundTasks();
  }

  /**
   * Uruchomienie zadań w tle:
   * - rollback liderów, gdy lider zostanie utracony
   * - aktualizacje embedów / backupy sojuszy
   * - możliwość dodania kolejnych cron-tasków
   */
  private static startBackgroundTasks() {
    // Co 10 minut sprawdzaj rollback liderów
    setInterval(async () => {
      try {
        await TransferLeaderSystem.checkOrphanLeaders();
      } catch (err) {
        console.error("❌ Error during orphan leader check:", err);
      }
    }, 10 * 60 * 1000);

    // Przykład: backup sojuszy, SnapshotService.backupAlliances() w osobnym interwale
    // setInterval(() => SnapshotService.backupAlliances(), 60 * 60 * 1000);
  }
}