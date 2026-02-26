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
 * - Integracja z RoleModule
 * - Integracja z BroadcastModule
 * - Integracja z ChannelModule
 *
 * ARCHITEKTURA:
 * Database → Repository → AllianceManager → Modules
 *
 * WAŻNE:
 * - Lider NIE jest ustawiany przy create (komenda systemowa setLeader)
 * - Tag i nazwa muszą być unikalne na serwerze
 * - ChannelModule uruchamia się automatycznie przy create
 * - confirmDelete usuwa role + kanały + broadcast
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

import {
  AllianceRepo,
  PendingDeletionRepo
} from "../../data/Repositories";

const MAX_MEMBERS = 100;
const MAX_R4 = 10;

export class AllianceManager {

  // =========================================================
  // CREATE
  // =========================================================

  static async createAlliance(
    actorId: string,
    guild: Guild,
    allianceId: string,
    tag: string,
    name: string
  ): Promise<void> {

    // ---- uniqueness check (TAG + NAME) ----
    const allAlliances = AllianceRepo.getAll();

    if (allAlliances.some(a => a.tag.toLowerCase() === tag.toLowerCase())) {
      throw new Error("Alliance tag already exists");
    }

    if (allAlliances.some(a => a.name.toLowerCase() === name.toLowerCase())) {
      throw new Error("Alliance name already exists");
    }

    // ---- base object ----
    const alliance: Alliance = {
      id: allianceId,
      tag,
      name,
      members: {
        r5: null,
        r4: [],
        r3: []
      },
      roles: {},
      channels: {},
      infrastructure: undefined
    };

    // ---- persist base first ----
    AllianceRepo.set(allianceId, alliance);

    // ---- create roles ----
    const createdRoles = await RoleModule.createRoles(guild, allianceId, tag);
    alliance.roles = createdRoles;

    // ---- create channels ----
    const createdInfrastructure = await ChannelModule.createChannels(
      guild,
      allianceId,
      tag
    );

    alliance.infrastructure = createdInfrastructure;

    // ---- broadcast setup ----
    await BroadcastModule.initializeAlliance(allianceId, tag, name);

    AllianceRepo.set(allianceId, alliance);

    Helpers.logAudit(allianceId, {
      action: "createAlliance",
      actorId,
      tag,
      name
    });
  }

  // =========================================================
  // MEMBERS
  // =========================================================

  static async addMember(
    actorId: string,
    allianceId: string,
    userId: string
  ): Promise<void> {

    const alliance = this.getAllianceOrThrow(allianceId);

    if (Helpers.isMember(alliance, userId))
      throw new Error("User already member");

    if (Helpers.getTotalMembers(alliance) >= MAX_MEMBERS)
      throw new Error("Alliance is full");

    alliance.members.r3.push(userId);

    AllianceRepo.set(allianceId, alliance);

    Helpers.logAudit(allianceId, {
      action: "addMember",
      actorId,
      userId
    });
  }

  static async promoteToR4(
    actorId: string,
    allianceId: string,
    userId: string
  ): Promise<void> {

    const alliance = this.getAllianceOrThrow(allianceId);

    if (!alliance.members.r3.includes(userId))
      throw new Error("User is not R3");

    if (alliance.members.r4.length >= MAX_R4)
      throw new Error("Max R4 reached");

    alliance.members.r3 =
      alliance.members.r3.filter(u => u !== userId);

    alliance.members.r4.push(userId);

    AllianceRepo.set(allianceId, alliance);

    Helpers.logAudit(allianceId, {
      action: "promoteToR4",
      actorId,
      userId
    });
  }

  static async removeMember(
    actorId: string,
    allianceId: string,
    userId: string
  ): Promise<void> {

    const alliance = this.getAllianceOrThrow(allianceId);

    if (alliance.members.r5 === userId)
      alliance.members.r5 = null;

    alliance.members.r4 =
      alliance.members.r4.filter(u => u !== userId);

    alliance.members.r3 =
      alliance.members.r3.filter(u => u !== userId);

    AllianceRepo.set(allianceId, alliance);

    Helpers.logAudit(allianceId, {
      action: "removeMember",
      actorId,
      userId
    });
  }

  // =========================================================
  // LEADERSHIP
  // =========================================================

  static async transferLeadership(
    actorId: string,
    allianceId: string,
    newLeaderId: string
  ): Promise<void> {

    await TransferLeaderSystem.transferLeadership(
      actorId,
      allianceId,
      newLeaderId
    );
  }

  // =========================================================
  // UPDATE
  // =========================================================

  static async updateTag(
    actorId: string,
    allianceId: string,
    newTag: string
  ): Promise<void> {

    const alliance = this.getAllianceOrThrow(allianceId);

    const exists = AllianceRepo
      .getAll()
      .some(a =>
        a.id !== allianceId &&
        a.tag.toLowerCase() === newTag.toLowerCase()
      );

    if (exists)
      throw new Error("Alliance tag already exists");

    const oldTag = alliance.tag;
    alliance.tag = newTag;

    await RoleModule.updateTag(allianceId, newTag);
    await BroadcastModule.updateTag(allianceId, newTag);
    await ChannelModule.updateTag(allianceId, newTag);

    AllianceRepo.set(allianceId, alliance);

    Helpers.logAudit(allianceId, {
      action: "updateTag",
      actorId,
      oldTag,
      newTag
    });
  }

  static async updateName(
    actorId: string,
    allianceId: string,
    newName: string
  ): Promise<void> {

    const alliance = this.getAllianceOrThrow(allianceId);

    const exists = AllianceRepo
      .getAll()
      .some(a =>
        a.id !== allianceId &&
        a.name.toLowerCase() === newName.toLowerCase()
      );

    if (exists)
      throw new Error("Alliance name already exists");

    const oldName = alliance.name;
    alliance.name = newName;

    await BroadcastModule.updateName(allianceId, newName);

    AllianceRepo.set(allianceId, alliance);

    Helpers.logAudit(allianceId, {
      action: "updateName",
      actorId,
      oldName,
      newName
    });
  }

  // =========================================================
  // DELETE
  // =========================================================

  static requestDelete(
    actorId: string,
    allianceId: string
  ): void {

    const alliance = this.getAllianceOrThrow(allianceId);

    PendingDeletionRepo.set(allianceId, alliance);

    Helpers.logAudit(allianceId, {
      action: "requestDelete",
      actorId
    });
  }

  static async confirmDelete(
    actorId: string,
    guild: Guild,
    allianceId: string
  ): Promise<void> {

    const alliance =
      PendingDeletionRepo.get(allianceId);

    if (!alliance)
      throw new Error("No pending deletion");

    // ---- remove infrastructure ----
    await ChannelModule.deleteChannels(guild, allianceId);

    // ---- remove roles ----
    await RoleModule.removeRoles(alliance.roles);

    // ---- remove broadcast ----
    await BroadcastModule.removeAlliance(allianceId);

    // ---- remove repo entries ----
    PendingDeletionRepo.delete(allianceId);
    AllianceRepo.delete(allianceId);

    Helpers.logAudit(allianceId, {
      action: "confirmDelete",
      actorId
    });
  }

  // =========================================================
  // HELPERS
  // =========================================================

  public static getAllianceOrThrow(
    id: string
  ): Alliance {

    const alliance = AllianceRepo.get(id);

    if (!alliance)
      throw new Error(`Alliance ${id} not found`);

    return alliance;
  }

}