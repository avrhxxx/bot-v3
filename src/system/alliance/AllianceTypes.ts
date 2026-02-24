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
 * ZALEŻNOŚCI:
 * - Brak bezpośrednich zależności
 *
 * UWAGA:
 * - Typy używane w całym systemie sojuszy i modułach powiązanych
 * - Zachowują spójność z RoleModule, BroadcastModule i TransferLeaderSystem
 *
 * ============================================
 */

export interface AllianceMembers {
  r5: string;        // Leader (exactly one)
  r4: string[];      // Moderators
  r3: string[];      // Members
}

export interface AllianceRoles {
  r5RoleId: string;          // Discord role ID dla lidera
  r4RoleId: string;          // Discord role ID dla moderatorów
  r3RoleId: string;          // Discord role ID dla członków
  identityRoleId: string;    // ping-only role, zawsze powiązana z użytkownikiem
}

export interface AllianceChannels {
  categoryId: string;            // Kategoria główna sojuszu na Discord

  leadershipChannelId: string;   // Kanał tylko dla R5
  officersChannelId: string;     // Kanał dla R5 + R4
  membersChannelId: string;      // Kanał dla R5 + R4 + R3
  joinChannelId: string;         // Kanał publicznych zgłoszeń do sojuszu
}

export interface Alliance {
  id: string;                     // Unikalne ID wewnętrzne sojuszu
  guildId: string;                 // ID serwera Discord

  tag: string;                     // Dokładnie 3 alfanumeryczne znaki
  name: string;                    // Pełna nazwa sojuszu

  members: AllianceMembers;
  roles: AllianceRoles;
  channels: AllianceChannels;

  orphaned: boolean;               // true jeśli brak prawidłowej struktury liderów
  createdAt: number;               // Timestamp utworzenia sojuszu
}