
class BotControlDatabase {

  private controlRoleId: string | null = null;
  private authorizedUserIds: Set<string> = new Set();

  setControlRole(roleId: string) {
    this.controlRoleId = roleId;
  }

  getControlRole(): string | null {
    return this.controlRoleId;
  }

  setAuthorizedUsers(userIds: string[]) {
    this.authorizedUserIds = new Set(userIds);
  }

  getAuthorizedUsers(): string[] {
    return Array.from(this.authorizedUserIds);
  }

  addUser(userId: string) {
    this.authorizedUserIds.add(userId);
  }

  removeUser(userId: string) {
    this.authorizedUserIds.delete(userId);
  }

  isAuthorized(userId: string): boolean {
    return this.authorizedUserIds.has(userId);
  }
}

export const BotControlDB = new BotControlDatabase();