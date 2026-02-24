/**
 * ============================================
 * FILE: src/system/alliance/AllianceTypes.ts
 * LAYER: SYSTEM (Alliance Domain Types)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Definicja typów sojuszu
 * - Reprezentacja ról, członków i kanałów Discord
 *
 * ZALEŻNOŚCI:
 * - Brak bezpośrednich zależności
 *
 * UWAGA:
 * - Typy używane w całym systemie sojuszy i modułach powiązanych
 *
 * ============================================
 */

export interface AllianceMembers {
  r5: string;        // Leader (exactly one)
  r4: string[];      // Moderators
  r3: string[];      // Members
}

export interface AllianceRoles {
  r5RoleId: string;
  r4RoleId: string;
  r3RoleId: string;
  identityRoleId: string; // ping-only role, zawsze powiązana
}

export interface AllianceChannels {
  categoryId: string;

  leadershipChannelId: string; // R5 only
  officersChannelId: string;   // R5 + R4
  membersChannelId: string;    // R5 + R4 + R3
  joinChannelId: string;       // public join request channel
}

export interface Alliance {
  id: string;          // internal unique id
  guildId: string;     // Discord guild id

  tag: string;         // EXACTLY 3 alphanumeric characters
  name: string;        // pełna nazwa sojuszu

  members: AllianceMembers;
  roles: AllianceRoles;
  channels: AllianceChannels;

  orphaned: boolean;   // true jeśli brak prawidłowej struktury liderów
  createdAt: number;
}