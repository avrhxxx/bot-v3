// src/system/alliance/SystemInitializer.ts

import { AllianceService } from "../AllianceService";
import { MembershipModule } from "../MembershipModule";
import { RoleModule } from "../RoleModule/RoleModule";
import { ChannelModule } from "../ChannelModule/ChannelModule";
import { BroadcastModule } from "../BroadcastModule/BroadcastModule";
import { TransferLeaderSystem } from "../TransferLeaderSystem";
import { MutationGate } from "../../engine/MutationGate";
import { CommandLoader } from "../../commands/loader/CommandLoader";

export class SystemInitializer {
  /**
   * Inicjalizacja wszystkich modułów i komend
   */
  static async init() {
    // 1️⃣ Inicjalizacja atomowych locków
    await MutationGate.initLocks();

    // 2️⃣ Załadowanie danych z repozytoriów
    await AllianceService.loadAllAlliances();

    // 3️⃣ Synchronizacja ról i kanałów z Discord
    await RoleModule.syncAllRoles();
    await ChannelModule.syncAllChannels();

    // 4️⃣ Ładowanie wszystkich komend
    await CommandLoader.loadAllCommands();

    // 5️⃣ Walidacja spójności wszystkich sojuszy
    await AllianceService.validateAll();

    // 6️⃣ Start zadań w tle
    SystemInitializer.startBackgroundTasks();
  }

  /**
   * Uruchomienie zadań tła: rollback liderów, aktualizacje embedów, backup sojuszy
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

    // Tutaj można dodać backupy sojuszy lub inne cron-taski
    // np. SnapshotService.backupAlliances() w osobnym interwale
  }
}