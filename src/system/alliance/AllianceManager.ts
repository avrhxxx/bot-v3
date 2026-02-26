/**
 * ============================================
 * FILE: src/system/alliance/AllianceManager.ts
 * LAYER: SYSTEM (Core Domain Service)
 * ============================================
 *
 * ZAWARTOŚĆ:
 * - Główny manager logiki sojuszu
 * - Operacje CRUD
 * - Zarządzanie członkami
 * - Integracja z RoleModule, BroadcastModule i ChannelModule
 *
 * ARCHITEKTURA:
 * Database → Repository → AllianceManager → Modules
 *
 * WAŻNE:
 * - Lider NIE jest ustawiany przy create (komenda systemowa setLeader)
 * - Tag i nazwa muszą być unikalne na serwerze
 * - Kanały i kategoria Discord są aktualizowane dynamicznie
 *
 * ============================================
 */

import { Guild } from "discord.js";
import { Alliance } from "./AllianceTypes";
import { AllianceHelpers as Helpers } from "./AllianceHelpers";
import { RoleModule } from "./modules/role/RoleModule";
import { BroadcastModule } from "./modules/broadcast/BroadcastModule";
import { ChannelModule } from "./modules/channel/ChannelModule";
import { TransferLeaderSystem } from "./TransferLeaderSystem";

import { AllianceRepo } from "../../data/Repositories";

const MAX_MEMBERS = 100;
const MAX_R4 = 10;

export class AllianceManager {

  // =========================================================
  // CREATE
  // =========================================================
  /**
   * Tworzy nowy sojusz na serwerze Discord:
   * - sprawdza unikalność tagu i nazwy
   * - zapisuje podstawowe dane w repo
   * - tworzy role Discord
   * - tworzy kanały i kategorię
   * - inicjalizuje broadcast
   */
  static async createAlliance(
    actorId: string,
    guild: Guild,
    allianceId: string,
    tag: string,
    name: string
  ): Promise<void> {
    // ---- uniqueness check ----
    const allAlliances = AllianceRepo.getAll();
    if (allAlliances.some(a => a.tag.toLowerCase() === tag.toLowerCase()))
      throw new Error("Alliance tag already exists");
    if (allAlliances.some(a => a.name.toLowerCase() === name.toLowerCase()))
      throw new Error("Alliance name already exists");

    // ---- base object ----
    const alliance: Alliance = {
      id: allianceId,
      guildId: guild.id,
      tag,
      name,
      members: { r5: null, r4: [], r3: [] },
      roles: {} as any,
      channels: {} as any,
      orphaned: true,
      createdAt: Date.now()
    };

    // ---- persist base ----
    AllianceRepo.set(allianceId, alliance);

    // ---- create roles ----
    const createdRoles = await RoleModule.createRoles(guild, tag);
    alliance.roles = createdRoles;

    // ---- create channels/kategoria ----
    const createdChannels = await ChannelModule.createChannels(guild, allianceId, tag, name);
    alliance.channels = createdChannels;

    // ---- initialize broadcast ----
    await BroadcastModule.initializeAlliance(allianceId, tag, name);

    AllianceRepo.set(allianceId, alliance);

    Helpers.logAudit(allianceId, { action: "createAlliance", actorId, tag, name });
  }

  // =========================================================
  // MEMBERS
  // =========================================================
  /**
   * Dodaje nowego członka (R3) do sojuszu
   * - aktualizuje repo
   * - dynamicznie aktualizuje nazwę kategorii
   */
  static async addMember(actorId: string, allianceId: string, userId: string) {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (Helpers.isMember(alliance, userId))
      throw new Error("User already member");
    if (Helpers.getTotalMembers(alliance) >= MAX_MEMBERS)
      throw new Error("Alliance full");

    alliance.members.r3.push(userId);
    AllianceRepo.set(allianceId, alliance);

    // ❗ Aktualizacja kategorii (liczba członków)
    await ChannelModule.updateCategoryName(allianceId);

    Helpers.logAudit(allianceId, { action: "addMember", actorId, userId });
  }

  /**
   * Promuje członka R3 do R4
   * - sprawdza limit R4
   * - aktualizuje repo
   * - dynamicznie aktualizuje nazwę kategorii
   */
  static async promoteToR4(actorId: string, allianceId: string, userId: string) {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (!alliance.members.r3.includes(userId))
      throw new Error("User is not R3");
    if (alliance.members.r4.length >= MAX_R4)
      throw new Error("Max R4 reached");

    alliance.members.r3 = alliance.members.r3.filter(u => u !== userId);
    alliance.members.r4.push(userId);

    AllianceRepo.set(allianceId, alliance);

    // ❗ Aktualizacja kategorii (opcjonalnie można uwzględnić role w nazwie)
    await ChannelModule.updateCategoryName(allianceId);

    Helpers.logAudit(allianceId, { action: "promoteToR4", actorId, userId });
  }

  /**
   * Usuwa członka z sojuszu (wszystkie role)
   * - aktualizuje repo
   * - dynamicznie aktualizuje nazwę kategorii
   */
  static async removeMember(actorId: string, allianceId: string, userId: string) {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (alliance.members.r5 === userId) alliance.members.r5 = null;
    alliance.members.r4 = alliance.members.r4.filter(u => u !== userId);
    alliance.members.r3 = alliance.members.r3.filter(u => u !== userId);

    AllianceRepo.set(allianceId, alliance);

    // ❗ Aktualizacja kategorii (liczba członków)
    await ChannelModule.updateCategoryName(allianceId);

    Helpers.logAudit(allianceId, { action: "removeMember", actorId, userId });
  }

  // =========================================================
  // LEADERSHIP
  // =========================================================
  /**
   * Przenosi lidera na nowego użytkownika
   * - wywołuje TransferLeaderSystem
   * - dynamicznie aktualizuje kategorię
   */
  static async transferLeadership(actorId: string, allianceId: string, newLeaderId: string) {
    await TransferLeaderSystem.transferLeadership(actorId, allianceId, newLeaderId);

    // ❗ Aktualizacja kategorii (jeżeli chcemy np. oznaczyć lidera w nazwie)
    await ChannelModule.updateCategoryName(allianceId);
  }

  // =========================================================
  // UPDATE
  // =========================================================
  /**
   * Aktualizuje tag sojuszu
   * - sprawdza unikalność
   * - aktualizuje repo
   * - aktualizuje role Discord, broadcast, kategorię
   */
  static async updateTag(actorId: string, allianceId: string, newTag: string) {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (AllianceRepo.getAll().some(a => a.id !== allianceId && a.tag.toLowerCase() === newTag.toLowerCase()))
      throw new Error("Alliance tag already exists");

    const oldTag = alliance.tag;
    alliance.tag = newTag;
    AllianceRepo.set(allianceId, alliance);

    await RoleModule.updateTag(allianceId, newTag);
    await BroadcastModule.updateTag(allianceId, newTag);
    await ChannelModule.updateCategoryName(allianceId); // ❗ dynamic update

    Helpers.logAudit(allianceId, { action: "updateTag", actorId, oldTag, newTag });
  }

  /**
   * Aktualizuje nazwę sojuszu
   * - sprawdza unikalność
   * - aktualizuje repo
   * - aktualizuje broadcast i kategorię
   */
  static async updateName(actorId: string, allianceId: string, newName: string) {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (AllianceRepo.getAll().some(a => a.id !== allianceId && a.name.toLowerCase() === newName.toLowerCase()))
      throw new Error("Alliance name already exists");

    const oldName = alliance.name;
    alliance.name = newName;
    AllianceRepo.set(allianceId, alliance);

    await BroadcastModule.updateName(allianceId, newName);
    await ChannelModule.updateCategoryName(allianceId); // ❗ dynamic update

    Helpers.logAudit(allianceId, { action: "updateName", actorId, oldName, newName });
  }

  // =========================================================
  // DELETE
  // =========================================================
  /**
   * Usuwa sojusz natychmiastowo poprzez komendę systemową Alliance Delete
   * - usuwa kanały/kategorię Discord
   * - usuwa role Discord
   * - usuwa broadcast
   * - usuwa wpis w repozytorium
   */
  static async confirmDelete(actorId: string, guild: Guild, allianceId: string) {
    const alliance = AllianceRepo.get(allianceId);
    if (!alliance) throw new Error(`Alliance ${allianceId} not found`);

    // ---- remove infrastructure ----
    await ChannelModule.deleteChannels(guild, allianceId);

    // ---- remove roles ----
    await RoleModule.removeRoles(alliance.roles);

    // ---- remove broadcast ----
    await BroadcastModule.removeAlliance(allianceId);

    // ---- remove repo entries ----
    AllianceRepo.delete(allianceId);

    Helpers.logAudit(allianceId, { action: "confirmDelete", actorId });
  }

  // =========================================================
  // HELPERS
  // =========================================================
  /**
   * Pobiera sojusz z repo lub rzuca wyjątek
   */
  public static getAllianceOrThrow(id: string): Alliance {
    const alliance = AllianceRepo.get(id);
    if (!alliance) throw new Error(`Alliance ${id} not found`);
    return alliance;
  }
}