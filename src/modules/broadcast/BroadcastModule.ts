export class BroadcastModule {
  static notifyJoin(allianceId: string, memberId: string) {
    console.log(`[Broadcast] Member ${memberId} joined ${allianceId}`);
  }

  static notifyLeaderChange(allianceId: string, newLeaderId: string) {
    console.log(`[Broadcast] Leader changed to ${newLeaderId} in ${allianceId}`);
  }
}