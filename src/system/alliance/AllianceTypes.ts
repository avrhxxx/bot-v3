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

export type AllianceRole = "R3" | "R4" | "R5";

/**
 * Typ członka sojuszu – teraz tylko userId i rola w kontekście list r3/r4/r5
 */
export interface AllianceMember {
  userId: string;
  role: AllianceRole;
}

/**
 * Role Discord dla sojuszu
 */
export interface AllianceRoles {
  r5RoleId: string;          // Discord role ID dla lidera
  r4RoleId: string;          // Discord role ID dla moderatorów
  r3RoleId: string;          // Discord role ID dla członków
  identityRoleId: string;    // ping-only role, zawsze powiązana z użytkownikiem
}

/**
 * Kanały Discord powiązane z sojuszem
 */
export interface AllianceChannels {
  categoryId: string;            // Kategoria główna sojuszu na Discord

  leadershipChannelId: string;   // Kanał tylko dla R5
  officersChannelId: string;     // Kanał dla R5 + R4
  membersChannelId: string;      // Kanał dla R5 + R4 + R3
  joinChannelId: string;         // Kanał publicznych zgłoszeń do sojuszu

  announceChannelId: string;     // Kanał, w którym bot ogłasza wiadomości od R5/R4
  welcomeChannelId: string;      // Kanał, w którym bot wita nowych członków
}

/**
 * Struktura sojuszu
 */
export interface Alliance {
  id: string;                     // Unikalne ID wewnętrzne sojuszu
  guildId: string;                 // ID serwera Discord

  tag: string;                     // Dokładnie 3 alfanumeryczne znaki
  name: string;                    // Pełna nazwa sojuszu

  // Teraz osobne tablice dla r5, r4, r3
  members: {
    r5?: string | null;            // Lider – tylko jeden, może być null
    r4: string[];                  // Moderators
    r3: string[];                  // Regular members
  };

  roles: AllianceRoles;
  channels: AllianceChannels;

  orphaned: boolean;               // true jeśli brak prawidłowej struktury liderów
  createdAt: number;               // Timestamp utworzenia sojuszu

  pendingJoins?: { userId: string; requestedAt: number }[];
}

/**
 * Snapshot sojuszu
 */
export interface AllianceSnapshot {
  allianceId: string;
  checksum: string;
  memberCount: number;
  r5Count: number;
  r4Count: number;
  r3Count: number;
  orphaned: boolean;
  createdAt: number;
  snapshotAt: number;
}

/**
 * Alias typów używanych w repozytoriach i Health
 */
export type SnapshotRecord = AllianceSnapshot;
export type OwnershipRecord = string;
export type HealthStateType = HealthState;

/**
 * ============================================
 * FILEPATH: src/system/alliance/AllianceTypes.ts
 * ============================================
 */