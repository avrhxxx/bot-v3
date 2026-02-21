export class Database {
  public alliances: Map<string, any> = new Map();
  public ownership: Map<string, any> = new Map();
  public health: Map<string, any> = new Map();
  public pendingDeletions: Map<string, any> = new Map();
}

export const db = new Database();