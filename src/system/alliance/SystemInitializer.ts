// src/system/alliance/SystemInitializer.ts

import { AllianceService } from "../AllianceService";
import { MembershipModule } from "../MembershipModule";
import { RoleModule } from "../RoleModule/RoleModule";
import { ChannelModule } from "../ChannelModule/ChannelModule";
import { BroadcastModule } from "../BroadcastModule/BroadcastModule";
import { TransferLeaderSystem } from "../TransferLeaderSystem";
import { MutationGate } from "../../engine/MutationGate";

export class SystemInitializer {
  /**
   * Inicjalizacja wszystkich modułów
   */
  static async init() {
    // 1️⃣ Inicjalizacja atomowych locków
    await MutationGate.initLocks();

    // 2️⃣ Load danych z repozytoriów
    await AllianceService.loadAllAlliances();

    // 3️⃣ Synchronizacja ról i kanałów z Discord
    await RoleModule.syncAllRoles();
    await ChannelModule.syncAllChannels();

    // 4️⃣ Walidacja spójności wszystkich sojuszy
    await AllianceService.validateAll();

    // 5️⃣ Start zadań w tle
    SystemInitializer.startBackgroundTasks();
  }

  /**
   * Uruchomienie zadań tła: rollback liderów, aktualizacje embedów, backup sojuszy
   */
  private static startBackgroundTasks() {
    // Przykład: co 10 minut sprawdzaj rollback liderów
    setInterval(async () => {
      await TransferLeaderSystem.checkOrphanLeaders();
    }, 10 * 60 * 1000);

    // Tutaj można dodać backupy sojuszy lub inne cron-taski
  }
}