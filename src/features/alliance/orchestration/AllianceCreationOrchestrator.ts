import { v4 as uuid } from "uuid";
import { AllianceService } from "../AllianceService";
import { AllianceRoles, AllianceChannels } from "../AllianceTypes";
import { AllianceIntegrity } from "../integrity/AllianceIntegrity";

/**
 * Orchestrates full alliance creation flow.
 *
 * Flow:
 * 1. Validate tag
 * 2. Create Discord channels (System Layer)
 * 3. Create Discord roles (System Layer)
 * 4. Assign leader role
 * 5. Persist alliance domain model
 */
export class AllianceCreationOrchestrator {
  static async execute(params: {
    actorId: string;
    guildId: string;
    tag: string;
    name: string;
    leaderId?: string;
    createChannels: () => Promise<AllianceChannels>;
    createRoles: () => Promise<AllianceRoles>;
    assignLeaderRoles: (leaderId: string, roles: AllianceRoles) => Promise<void>;
  }) {
    const {
      actorId,
      guildId,
      tag,
      name,
      leaderId,
      createChannels,
      createRoles,
      assignLeaderRoles
    } = params;

    const finalLeaderId = leaderId ?? actorId;

    // 1️⃣ Validate tag format
    AllianceIntegrity.validateTag(tag);

    // 2️⃣ Ensure tag uniqueness
    AllianceIntegrity.ensureTagUnique(guildId, tag);

    // 3️⃣ Generate internal alliance id
    const allianceId = uuid();

    // 4️⃣ Create Discord structure (System Layer responsibility)
    const channels = await createChannels();
    const roles = await createRoles();

    // 5️⃣ Assign leader roles
    await assignLeaderRoles(finalLeaderId, roles);

    // 6️⃣ Persist domain model
    await AllianceService.createAlliance({
      actorId,
      guildId,
      allianceId,
      tag: tag.toUpperCase(),
      name,
      leaderId: finalLeaderId,
      roles,
      channels
    });

    return allianceId;
  }
}