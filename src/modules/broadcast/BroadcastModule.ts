// src/modules/broadcast/BroadcastModule.ts
export class BroadcastModule {
  static notifyJoin(allianceId: string, memberId: string) {
    console.log(`[BroadcastModule] notifyJoin ${memberId} in ${allianceId}`);
  }
}