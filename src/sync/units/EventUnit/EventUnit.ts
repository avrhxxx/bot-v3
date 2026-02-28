// src/sync/units/EventUnit/EventUnit.ts
import { Guild } from "discord.js";
import { DelayModel } from "../../SyncDelayModel";
import { SyncLiveDB } from "../../../db/SyncLiveDB";
import { BotControlDB } from "../../../db/BotControlDB";
import { BotControlService } from "../../../botControl/BotControlService";
import { allianceDB } from "../../../db/AllianceDB";
import { AllianceService } from "../../../alliance/AllianceService";

export class EventUnit {
  public name = "EventUnit";
  private delayModel: DelayModel;
  private botService: BotControlService;

  constructor(delayModel: DelayModel, botService: BotControlService) {
    this.delayModel = delayModel;
    this.botService = botService;
  }

  // eventData: np. { type: 'roleAdd', userId: string, roleId: string }
  public async handleEvent(guild: Guild, eventData: any) {
    console.log(`[EventUnit] Handling event:`, eventData);

    // 1️⃣ Freeze synchronizacji cyklicznej
    this.delayModel.setFreeze(true);

    // 2️⃣ Aktualizacja liveDB
    const liveDB = SyncLiveDB.getData();
    switch (eventData.type) {
      case "roleAdd":
        liveDB.members[eventData.userId].roles.push(eventData.roleId);
        break;
      case "roleRemove":
        liveDB.members[eventData.userId].roles =
          liveDB.members[eventData.userId].roles.filter(r => r !== eventData.roleId);
        break;
      case "channelCreate":
        liveDB.channels[eventData.channelName] = eventData.channelId;
        break;
      case "channelDelete":
        delete liveDB.channels[eventData.channelName];
        break;
      default:
        console.log(`[EventUnit] Unknown event type: ${eventData.type}`);
    }

    // 3️⃣ Korekta jeśli dotyczy Bot Control
    if (eventData.roleId === BotControlDB.roleId) {
      await this.botService.updateMembers(guild, BotControlDB.authorityIds);
    }

    // 4️⃣ Korekta jeśli dotyczy sojuszy
    if (eventData.type.startsWith("channel") || eventData.type.startsWith("role")) {
      // prosty przykład: odczyt live vs source i zgłoszenie do serwisu
      for (const [chName, chId] of Object.entries(allianceDB.channels)) {
        if (!guild.channels.cache.has(chId)) {
          await AllianceService.createAlliance(
            guild,
            chName.split(" · ")[0],
            chName.slice(-3)
          );
        }
      }
    }

    // 5️⃣ Odblokowanie synchronizacji cyklicznej
    this.delayModel.setFreeze(false);
    console.log(`[EventUnit] Event handling complete`);
  }
}