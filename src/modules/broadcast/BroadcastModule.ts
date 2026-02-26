// src/modules/broadcast/BroadcastModule.ts
import { ChannelModule } from "../channel/ChannelModule";

export class BroadcastModule {
  /**
   * Powiadomienie o dołączeniu członka do sojuszu
   */
  static async notifyJoin(allianceId: string, memberId: string): Promise<void> {
    // Można tu np. pobrać kanał sojuszu z ChannelModule
    const channel = await ChannelModule.getAllianceChannel(allianceId);
    console.log(`[BroadcastModule] notifyJoin: ${memberId} joined ${allianceId}`);
    
    // przykład wysłania wiadomości do kanału (stub)
    if (channel) {
      // channel.send(`${memberId} joined ${allianceId}`);
    }
  }

  /**
   * Powiadomienie o zmianie lidera
   */
  static async notifyLeaderChange(allianceId: string, memberId: string): Promise<void> {
    const channel = await ChannelModule.getAllianceChannel(allianceId);
    console.log(`[BroadcastModule] notifyLeaderChange: new leader ${memberId} in ${allianceId}`);
    
    // przykład wysłania wiadomości do kanału (stub)
    if (channel) {
      // channel.send(`New leader is ${memberId} in ${allianceId}`);
    }
  }
}