// File: src/system/Imports.ts
// AUTOGENEROWANY PLIK IMPORTÓW
// Nie edytować ręcznie – używaj generatora, aby aktualizować importy.

export * from "../config/config";
export * from "../data/Database";
export * from "../data/Repositories";
export * from "../discord/client";

// UWAGA: Dispatcher już eksportuje MutationGate i MutationOptions,
// więc nie eksportujemy ich osobno, aby uniknąć konfliktu TS2308.
export * from "../engine/Dispatcher";

// Commands
export * from "../commands/Command";
export * from "../commands/CommandRegistry";
export * from "../commands/loader/CommandLoader";

// Commands alliance
export * from "../commands/alliance/demote";
export * from "../commands/alliance/join";
export * from "../commands/alliance/kick";
export * from "../commands/alliance/leave";
export * from "../commands/alliance/promote";
export * from "../commands/alliance/transferLeader";
export * from "../commands/alliance/updateName";
export * from "../commands/alliance/updateTag";

// System core
export * from "./Health";
export * from "./SafeMode";
export * from "./Ownership";
export * from "./OwnerModule/OwnerModule";
export * from "./TimeModule/TimeModule";

// Alliance core
export * from "./alliance/AllianceService";
export * from "./alliance/AllianceSystem";
export * from "./alliance/AllianceTypes";
export * from "./alliance/SystemInitializer";
export * from "./alliance/TransferLeaderSystem";
export * from "./alliance/CommandDispatcher/CommandDispatcher";
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
export * from "./snapshot/SnapshotTypes";

// Journal
export * from "../journal/Journal";
export * from "../journal/JournalTypes";

// Locks
export * from "../locks/AllianceLock";
export * from "../locks/GlobalLock";