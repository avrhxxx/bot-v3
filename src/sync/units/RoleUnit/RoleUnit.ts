import { Guild } from "discord.js";
import { syncLiveDB } from "../../../db/SyncLiveDB";
import { allianceDB } from "../../../db/AllianceDB";
import { DelayModel } from "../../SyncDelayModel";
import { RoleModule } from "../../../modules/RoleModule";

export class RoleUnit {
  private delayModel: DelayModel;
  public name = "RoleUnit";

  constructor(delayModel: DelayModel) {
    this.delayModel = delayModel;
  }

  public async run(guild: Guild) {
    console.log(`[RoleUnit] Verifying alliance roles...`);

    const liveRoles = syncLiveDB.roles;
    const sourceRoles = allianceDB.roles;

    for (const [roleName, roleId] of Object.entries(sourceRoles)) {
      if (!Object.values(liveRoles).includes(roleId)) {
        console.log(`[RoleUnit] Missing role: ${roleName}, should create/update via RoleModule`);
        // tutaj serwis/allianceService będzie tworzył/updatował rolę
      }

      await this.delayModel.waitAction();
    }
  }
}
