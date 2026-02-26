import { ChannelModule } from "../channel/ChannelModule";

/** Role sojuszu */
export type AllianceRole = "R3" | "R4" | "R5";

/** Obsługiwane typy zdarzeń broadcast */
export type BroadcastEvent =
  | "joinRequest"
  | "join"
  | "leave"
  | "promotion"
  | "demotion"
  | "customMessage"
  | "leadershipChange"
  | "nameChange"
  | "tagChange"
  | "allianceRemoval";

/** Mapowanie payload dla każdego eventu */
interface EventPayloadMap {
  joinRequest: { allianceId: string; userId: string; channelId: string; pingRoleIds?: string[]; pingUserIds?: string[] };
  join: { allianceId: string; userId: string; channelId: string; pingRoleIds?: string[]; pingUserIds?: string[] };
  leave: { allianceId: string; userId: string; channelId: string; pingRoleIds?: string[]; pingUserIds?: string[] };
  promotion: { allianceId: string; userId: string; newRole: AllianceRole; channelId: string; pingRoleIds?: string[]; pingUserIds?: string[] };
  demotion: { allianceId: string; userId: string; newRole: AllianceRole; channelId: string; pingRoleIds?: string[]; pingUserIds?: string[] };
  customMessage: { allianceId: string; message: string; actorId?: string; channelId: string; pingRoleIds?: string[]; pingUserIds?: string[] };
  leadershipChange: { allianceId: string; oldLeaderId: string; newLeaderId: string; channelId: string; pingRoleIds?: string[] };
  nameChange: { allianceId: string; message: string; channelId: string; pingRoleIds?: string[] };
  tagChange: { allianceId: string; message: string; channelId: string; pingRoleIds?: string[] };
  allianceRemoval: { allianceId: string; message: string; channelId: string; pingRoleIds?: string[] };
}

/** Typ listenera dla eventu */
type BroadcastListener<T extends BroadcastEvent> = (payload: EventPayloadMap[T]) => void;

export class BroadcastModule {
  private static listeners: { [K in BroadcastEvent]?: BroadcastListener<K>[] } = {};

  // ----------------- EVENT MANAGEMENT -----------------
  static on<T extends BroadcastEvent>(event: T, listener: BroadcastListener<T>) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(listener);
  }

  static emit<T extends BroadcastEvent>(event: T, payload: EventPayloadMap[T]) {
    const eventListeners = this.listeners[event] ?? [];
    for (const listener of eventListeners) {
      try { listener(payload); } 
      catch (error) { console.error(`BroadcastModule error '${event}'`, payload, error); }
    }
  }

  static off<T extends BroadcastEvent>(event: T, listener?: BroadcastListener<T>) {
    if (!this.listeners[event]) return;
    if (!listener) delete this.listeners[event];
    else this.listeners[event] = this.listeners[event]!.filter(l => l !== listener);
  }

  static clearAll() { this.listeners = {}; }
  static clearEventListeners(event: BroadcastEvent) { delete this.listeners[event]; }

  // ----------------- DEFAULT CHANNELS -----------------
  private static defaultChannels: Record<BroadcastEvent, (allianceId: string) => string | undefined> = {
    joinRequest: ChannelModule.getStaffChannel,
    join: ChannelModule.getWelcomeChannel,
    leave: ChannelModule.getAnnounceChannel,
    promotion: ChannelModule.getAnnounceChannel,
    demotion: ChannelModule.getAnnounceChannel,
    customMessage: ChannelModule.getAnnounceChannel,
    leadershipChange: ChannelModule.getAnnounceChannel,
    nameChange: ChannelModule.getAnnounceChannel,
    tagChange: ChannelModule.getAnnounceChannel,
    allianceRemoval: ChannelModule.getAnnounceChannel,
  };

  // ----------------- HELPER: PINGS -----------------
  private static formatPings(payload: { pingRoleIds?: string[]; pingUserIds?: string[] }): string {
    const roles = (payload.pingRoleIds ?? []).map(r => `<@&${r}>`).join(' ');
    const users = (payload.pingUserIds ?? []).map(u => `<@${u}>`).join(' ');
    return [roles, users].filter(Boolean).join(' ');
  }

  // ----------------- ALLIANCE-SPECIFIC ANNOUNCE -----------------
  private static async announce<T extends BroadcastEvent>(
    event: T,
    payload: Omit<EventPayloadMap[T], "channelId">
  ) {
    const channelId = this.defaultChannels[event](payload.allianceId);
    if (!channelId) return;

    // TS-safe emit
    this.emit(event, { ...payload, channelId } as EventPayloadMap[T]);
  }

  // ----------------- PREDEFINED ANNOUNCEMENTS -----------------
  static async announceJoinRequest(allianceId: string, userId: string, pingRoleIds?: string[], pingUserIds?: string[]) {
    return this.announce("joinRequest", { allianceId, userId, pingRoleIds, pingUserIds });
  }

  static async announceJoin(allianceId: string, userId: string, pingRoleIds?: string[], pingUserIds?: string[]) {
    return this.announce("join", { allianceId, userId, pingRoleIds, pingUserIds });
  }

  static async announceLeave(allianceId: string, userId: string, pingRoleIds?: string[], pingUserIds?: string[]) {
    return this.announce("leave", { allianceId, userId, pingRoleIds, pingUserIds });
  }

  static async announcePromotion(allianceId: string, userId: string, newRole: AllianceRole, pingRoleIds?: string[], pingUserIds?: string[]) {
    return this.announce("promotion", { allianceId, userId, newRole, pingRoleIds, pingUserIds });
  }

  static async announceDemotion(allianceId: string, userId: string, newRole: AllianceRole, pingRoleIds?: string[], pingUserIds?: string[]) {
    return this.announce("demotion", { allianceId, userId, newRole, pingRoleIds, pingUserIds });
  }

  static async sendCustomMessage(allianceId: string, message: string, actorId?: string, pingRoleIds?: string[], pingUserIds?: string[]) {
    return this.announce("customMessage", { allianceId, message, actorId, pingRoleIds, pingUserIds });
  }

  static async announceLeadershipChange(allianceId: string, oldLeaderId: string, newLeaderId: string, identityRoleId: string) {
    return this.announce("leadershipChange", { allianceId, oldLeaderId, newLeaderId, pingRoleIds: [identityRoleId] });
  }

  static async announceNameChange(allianceId: string, oldName: string, newName: string, identityRoleId: string) {
    return this.announce("nameChange", { allianceId, message: `📝 Alliance name changed from **${oldName}** to **${newName}**.`, pingRoleIds: [identityRoleId] });
  }

  static async announceTagChange(allianceId: string, oldTag: string, newTag: string, identityRoleId: string) {
    return this.announce("tagChange", { allianceId, message: `🏷️ Alliance tag changed from **${oldTag}** to **${newTag}**.`, pingRoleIds: [identityRoleId] });
  }

  static async announceAllianceRemoval(allianceId: string, identityRoleId: string) {
    return this.announce("allianceRemoval", { allianceId, message: `❌ The alliance has been removed.`, pingRoleIds: [identityRoleId] });
  }

  // ----------------- MESSAGE FORMAT -----------------
  static formatMessage<T extends BroadcastEvent>(event: T, payload: EventPayloadMap[T]): string {
    const pings = this.formatPings(payload);
    switch (event) {
      case "joinRequest": return `📝 User <@${payload.userId}> has requested to join the alliance.${pings}`;
      case "join": return `🎉 User <@${payload.userId}> has joined the alliance!${pings}`;
      case "leave": return `❌ User <@${payload.userId}> has left the alliance.${pings}`;
      case "promotion": return `⬆️ User <@${payload.userId}> was promoted to ${payload.newRole}!${pings}`;
      case "demotion": return `⬇️ User <@${payload.userId}> was demoted to ${payload.newRole}.${pings}`;
      case "customMessage": return `📢 ${payload.actorId ? `<@${payload.actorId}>` : ""} says: ${payload.message ?? ""}${pings}`;
      case "leadershipChange": return `👑 Leadership Change: <@${payload.oldLeaderId}> → <@${payload.newLeaderId}> ${pings}`;
      case "nameChange":
      case "tagChange":
      case "allianceRemoval": return `${payload.message} ${pings}`;
      default: return `${event}: ${JSON.stringify(payload)}`;
    }
  }
}
