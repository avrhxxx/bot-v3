/**
 * ============================================
 * FILE: src/system/alliance/AllianceTypes.ts
 * LAYER: SYSTEM (Alliance Domain Types)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Definicja typów domenowych sojuszu
 * - Spójna reprezentacja członków, ról i kanałów
 * - Wspólna podstawa dla wszystkich modułów
 *
 * ARCHITEKTURA:
 * Database → Repository → AllianceManager → Modules
 *
 * WAŻNE:
 * - Brak legacy HealthState
 * - Brak SnapshotRepo
 * - Snapshot może istnieć jako osobny system (nie core)
 *
 * ============================================
 */

export type AllianceRole = "R3" | "R4" | "R5";

/**
 * Struktura ról Discord powiązanych z sojuszem
 */
export interface AllianceRoles {
  r5RoleId: string;        // Lider
  r4RoleId: string;        // Oficerowie
  r3RoleId: string;        // Członkowie
  identityRoleId: string;  // Rola identyfikacyjna (ping/tag)
}

/**
 * Struktura kanałów Discord powiązanych z sojuszem
 */
export interface AllianceChannels {
  categoryId: string;

  leadershipChannelId: string; // tylko R5
  officersChannelId: string;   // R5 + R4
  membersChannelId: string;    // R5 + R4 + R3
  joinChannelId: string;       // publiczne zgłoszenia

  announceChannelId: string;   // broadcast
  welcomeChannelId: string;    // powitania
}

/**
 * Główna struktura domenowa sojuszu
 */
export interface Alliance {

  // --- CORE ---
  id: string;          // Wewnętrzne ID systemowe
  guildId: string;     // ID serwera Discord

  tag: string;         // 3 znaki alfanumeryczne (walidowane w komendzie)
  name: string;        // Pełna nazwa sojuszu

  // --- MEMBERS ---
  members: {
    r5: string | null;  // Lider (max 1)
    r4: string[];       // Oficerowie
    r3: string[];       // Członkowie
  };

  // --- INFRASTRUCTURE ---
  roles: AllianceRoles;
  channels: AllianceChannels;

  // --- STATE ---
  orphaned: boolean;    // true jeśli brak lidera
  createdAt: number;    // timestamp utworzenia
  updatedAt?: number;   // opcjonalnie przy zmianach

  // --- JOIN SYSTEM ---
  pendingJoins?: {
    userId: string;
    requestedAt: number;
  }[];
}