import { Guild } from "discord.js";
import { Alliance } from "./AllianceTypes";
import { RoleModule } from "./modules/role/RoleModule";
import { BroadcastModule } from "./modules/broadcast/BroadcastModule";
import { ChannelModule } from "./modules/channel/ChannelModule";
import { TransferLeaderModule } from "./modules/transferleader/TransferLeaderModule";
import { AllianceRepo } from "../../data/Repositories";

/**
 * MODUŁ: AllianceManager
 * WARSTWA: SYSTEM (Core Domain Service)
 *
 * Odpowiada za:
 * - Tworzenie sojuszu (role, kanały)
 * - Zarządzanie członkami
 * - Promocja, degradacja, leave
 * - Przekazywanie lidera
 * - Aktualizację tagów i nazw
 * - Usuwanie sojuszu
 */
export class AllianceManager {

  static async createAlliance(actorId: string, guild: Guild, allianceId: string, tag: string, name: string): Promise<void> {
    const allAlliances = AllianceRepo.getAll();
    if (allAlliances.some(a => a.tag.toLowerCase() === tag.toLowerCase())) throw new Error("Alliance tag exists");
    if (allAlliances.some(a => a.name.toLowerCase() === name.toLowerCase())) throw new Error("Alliance name exists");

    const alliance: Alliance = { id: allianceId, guildId: guild.id, tag, name, members: { r5: null, r4: [], r3: [] }, roles: {} as any, channels: {} as any, orphaned: true, createdAt: Date.now() };
    AllianceRepo.set(allianceId, alliance);

    const createdRoles = await RoleModule.createRoles(guild, tag);
    alliance.roles = createdRoles;

    const createdChannels = await ChannelModule.createChannels(guild, allianceId, tag, name);
    alliance.channels = createdChannels;

    await BroadcastModule.initializeAlliance(allianceId, tag, name);
    AllianceRepo.set(allianceId, alliance);

    this.logAudit(allianceId, { action: "createAlliance", actorId, tag, name });
  }

  static async addMember(actorId: string, allianceId: string, userId: string) {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (this.isMember(alliance, userId)) throw new Error("User already member");
    if (this.getTotalMembers(alliance) >= 100) throw new Error("Alliance full");

    alliance.members.r3.push(userId);
    AllianceRepo.set(allianceId, alliance);

    await ChannelModule.updateCategoryName(allianceId);
    this.logAudit(allianceId, { action: "addMember", actorId, userId });
  }

  static async promoteToR4(actorId: string, allianceId: string, userId: string) {
    const alliance = this.getAllianceOrThrow(allianceId);
    if (!alliance.members.r3.includes(userId)) throw new Error("User is not R3");
    if (alliance.members.r4.length >= 10) throw new Error("Max R4 reached");

    alliance.members.r3 = alliance.members.r3.filter(u => u !== userId);
    alliance.members.r4.push(userId);

    AllianceRepo.set(allianceId, alliance);
    await ChannelModule.updateCategoryName(allianceId);
    this.logAudit(allianceId, { action: "promoteToR4", actorId, userId });
  }

  static async removeMember(actorId: string, allianceId: string, userId: string) {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (alliance.members.r5 === userId) alliance.members.r5 = null;
    alliance.members.r4 = alliance.members.r4.filter(u => u !== userId);
    alliance.members.r3 = alliance.members.r3.filter(u => u !== userId);

    AllianceRepo.set(allianceId, alliance);
    await ChannelModule.updateCategoryName(allianceId);
    this.logAudit(allianceId, { action: "removeMember", actorId, userId });
  }

  static async transferLeadership(actorId: string, allianceId: string, newLeaderId: string) {
    await TransferLeaderModule.transferLeadership(actorId, allianceId, newLeaderId);
    await ChannelModule.updateCategoryName(allianceId);
  }

  static getAllianceOrThrow(id: string): Alliance {
    const alliance = AllianceRepo.get(id);
    if (!alliance) throw new Error(`Alliance ${id} not found`);
    return alliance;
  }

  static isMember(alliance: Alliance, userId: string): boolean {
    return alliance.members.r3.includes(userId) || alliance.members.r4.includes(userId) || alliance.members.r5 === userId;
  }

  static getTotalMembers(alliance: Alliance): number {
    return (alliance.members.r3?.length || 0) + (alliance.members.r4?.length || 0) + (alliance.members.r5 ? 1 : 0);
  }

  static logAudit(allianceId: string, payload: any) { /* placeholder */ }

  static async fetchGuildMember(guildId: string, userId: string) { /* placeholder */ }
}