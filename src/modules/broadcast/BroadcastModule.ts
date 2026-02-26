// src/modules/broadcast/BroadcastModule.ts
import { ChannelModule } from "../channel/ChannelModule";

export class BroadcastModule {
  static notifyJoin(allianceId: string, memberId: string) {
    console.log(`[BroadcastModule] notifyJoin: ${memberId} joined ${allianceId}`);
  }

  static notifyLeaderChange(allianceId: string, memberId: string) {
    console.log(`[BroadcastModule] notifyLeaderChange: new leader ${memberId} in ${allianceId}`);
  }
}