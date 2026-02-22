export class AllianceIntegrity {
  static validateTag(tag: string): void
  static ensureTagUnique(guildId: string, tag: string): void
  static ensureUserNotInAlliance(userId: string): void
  static ensureRoleExclusivity(alliance, userId): void
  static ensureSingleR5(alliance): void
}