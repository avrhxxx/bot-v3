// File: src/system/Imports.ts
// ============================================
// CENTRALNY PLIK IMPORTÓW
// - Ręcznie zarządzany, bez generatora
// - Wszystkie kluczowe moduły, komendy i systemy
// - Aktualizacja wymaga ręcznej edycji przy dodawaniu nowych plików
// ============================================

// Config
export * from "../config/config";

// Data
export * from "../data/Database";
export * from "../data/Repositories";

// Discord client
export * from "../discord/client";

// Engine
export * from "../engine/Dispatcher";
export * from "../engine/MutationGate";

// Commands
export * from "../commands/Command";
export * from "../commands/CommandRegistry";
export * from "../commands/loader/CommandLoader";

// Commands – Alliance
export * from "../commands/alliance/accept";
export * from "../commands/alliance/broadcast";
export * from "../commands/alliance/demote";
export * from "../commands/alliance/deny";
export * from "../commands/alliance/join";
export * from "../commands/alliance/kick";
export * from "../commands/alliance/leave";
export * from "../commands/alliance/promote";
export * from "../commands/alliance/transferLeader";
export * from "../commands/alliance/updateName";
export * from "../commands/alliance/updateTag";

// Commands – System
export * from "../commands/sys/allianceCreate";
export * from "../commands/sys/allianceDelete";
export * from "../commands/sys/setLeader";

// System core
export * from "./Health";
export * from "./SafeMode";
export * from "./Ownership/Ownership";
export * from "./Ownership/OwnerRoleManager";
export * from "./Ownership/OwnerModule";
export * from "./TimeModule/TimeModule";

// Alliance core
export * from "./alliance/AllianceService";
export * from "./alliance/AllianceSystem";
export * from "./alliance/AllianceTypes";
export * from "./alliance/SystemInitializer";
export * from "./alliance/TransferLeaderSystem";
export * from "./alliance/orchestrator/AllianceOrchestrator";

// Alliance modules
export * from "./alliance/modules/broadcast/BroadcastModule";
export * from "./alliance/modules/channel/ChannelModule";
export * from "./alliance/modules/membership/MembershipModule";
export * from "./alliance/modules/role/RoleModule";

// Alliance integrity
export * from "./alliance/integrity/AllianceIntegrity";

// Snapshot system
export * from "./snapshot/IntegrityMonitor";
export * from "./snapshot/RepairService";
export * from "./snapshot/SnapshotService";

// Journal
export * from "../journal/Journal";
export * from "../journal/JournalTypes";

// Locks
export * from "../locks/AllianceLock";
export * from "../locks/GlobalLock";