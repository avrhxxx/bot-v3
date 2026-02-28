// src/sync/units/RoleUnit/RoleUnit.ts
import { Guild } from "discord.js";
import { DelayModel } from "../../SyncDelayModel";
import { SyncLiveDB } from "../../../db/SyncLiveDB";
import { allianceDB } from "../../../db/AllianceDB";
import { AllianceService } from "../../../alliance/AllianceService";

export class RoleUnit {
  public name = "RoleUnit";
  private delayModel: DelayModel;

  constructor(delayModel: DelayModel) {
    this.delayModel = delayModel;
  }

  public async run(guild: Guild): Promise<void> {
    console.log(`[RoleUnit] Start checking alliance roles`);

    const liveData = SyncLiveDB.getData(); // live roles info
    const sourceRoles = allianceDB.roles; // sourceDB

    // 1️⃣ Sprawdzenie brakujących ról
    for (const [roleName, roleId] of Object.entries(sourceRoles)) {
      const liveRoleId = liveData.roles?.[roleName];
      if (!liveRoleId || liveRoleId !== roleId) {
        console.log(`[RoleUnit] Rola "${roleName}" nie istnieje w liveDB lub różni się od sourceDB`);
        // Zgłaszamy do serwisu, aby utworzył/naprawił rolę
        await AllianceService.createAlliance(guild, roleName.split(" · ")[0], roleName.slice(-3));
        await this.delayModel.waitAction();
      }
    }

    // 2️⃣ Sprawdzenie nieautoryzowanych ról w liveDB
    for (const [roleName, liveRoleId] of Object.entries(liveData.roles || {})) {
      if (!sourceRoles[roleName]) {
        console.log(`[RoleUnit] Rola "${roleName}" istnieje w liveDB, ale nie ma jej w sourceDB`);
        // Zgłaszamy do serwisu usunięcie roli
        await AllianceService.deleteAlliance(
          guild,
          roleName.split(" · ")[0],
          roleName.slice(-3)
        );
        await this.delayModel.waitAction();
      }
    }

    console.log(`[RoleUnit] Check complete`);
  }
}