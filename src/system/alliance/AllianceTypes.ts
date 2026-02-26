/**
 * ============================================
 * FILE: src/system/alliance/AllianceTypes.ts
 * LAYER: SYSTEM (Alliance Domain Types)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Definicja typów sojuszu
 * - Reprezentacja ról, członków i kanałów Discord
 * - Podstawa do walidacji i logiki modułów sojuszy
 *
 * ============================================
 */

export type AllianceRole = "R3" | "R4" | "R5";

/** Członek sojuszu */
export interface AllianceMember {
  userId: string;
  role: AllianceRole;
}

/** Discord role IDs powiązane z sojuszem */
export interface AllianceRoles {
  r5RoleId: string;          // Lider
  r4RoleId: string;          // Moderator
  r3RoleId: string;          // Członek
  identityRoleId: string;    // role do pingów
}

/** Discord channels powiązane z sojuszem */
export interface AllianceChannels {
  categoryId: string;
  leadershipChannelId: string;
  officersChannelId: string;
  membersChannelId: string;
  joinChannelId: string;
  announceChannelId: string;
  welcomeChannelId: string;
}

/** Pełna struktura sojuszu */
export interface Alliance {
  id: string;
  guildId: string;
  tag: string;
  name: string;

  members: {
    r5?: string | null;
    r4: string[];
    r3: string[];
  };

  roles: AllianceRoles;
  channels: AllianceChannels;

  orphaned: boolean;
  createdAt: number;

  pendingJoins?: { userId: string; requestedAt: number }[];
}