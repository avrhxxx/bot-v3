// src/sync/units/PermsUnit/PermsUnit.ts
import { Guild, OverwriteResolvable } from "discord.js";
import { DelayModel } from "../../SyncDelayModel";
import { SyncLiveDB } from "../../../db/SyncLiveDB";
import { allianceDB } from "../../../db/AllianceDB";
import { BotControlDB } from "../../../db/BotControlDB";
import { AllianceService } from "../../../alliance/AllianceService";
import { BotControlService } from "../../../botControl/BotControlService";

export class PermsUnit {
  public name = "PermsUnit";
  private delayModel: DelayModel;
  private botService: BotControlService;

  constructor(delayModel: DelayModel, botService: BotControlService) {
    this.delayModel = delayModel;
    this.botService = botService;
  }

  public async run(guild: Guild): Promise<void> {
    console.log(`[PermsUnit] Start checking permissions`);

    const liveDB = SyncLiveDB.getData();
    const sourceAlliancePerms = allianceDB.permissions || {};
    const sourceSystemChannels = BotControlDB.channels;

    // --- 1️⃣ Permissions kanałów sojuszy ---
    for (const [chName, sourcePerms] of Object.entries(sourceAlliancePerms)) {
      const livePerms = liveDB.permissions?.[chName];
      if (!livePerms || JSON.stringify(livePerms) !== JSON.stringify(sourcePerms)) {
        console.log(`[PermsUnit] Permissions w kanale sojuszu "${chName}" niezgodne, zgłaszam do AllianceService`);
        await AllianceService.updateChannelPermissions(guild, chName, sourcePerms as OverwriteResolvable[]);
        liveDB.permissions = liveDB.permissions || {};
        liveDB.permissions[chName] = sourcePerms;
        await this.delayModel.waitAction();
      }
    }

    // --- 2️⃣ Permissions kanałów systemowych ---
    for (const [chName, chId] of Object.entries(sourceSystemChannels)) {
      const livePerms = liveDB.permissions?.[chName];
      const expectedPerms = BotControlDB.expectedPermissions?.[chName];
      if (expectedPerms && (!livePerms || JSON.stringify(livePerms) !== JSON.stringify(expectedPerms))) {
        console.log(`[PermsUnit] Permissions w kanale systemowym "${chName}" niezgodne, zgłaszam do BotControlService`);
        await this.botService.updateChannelPermissions(guild, chName, expectedPerms as OverwriteResolvable[]);
        liveDB.permissions = liveDB.permissions || {};
        liveDB.permissions[chName] = expectedPerms;
        await this.delayModel.waitAction();
      }
    }

    console.log(`[PermsUnit] Permission check complete`);
  }
}