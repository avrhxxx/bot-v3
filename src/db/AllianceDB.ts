
export interface AllianceRecord {
  name: string;
  tag: string;

  roles: Record<string, string>;       // roleName -> roleId
  categoryId?: string;                 // category channel id
  channels: Record<string, string>;    // channelName -> channelId

  logMessageId?: string;               // embed log message id
}

class AllianceDatabase {

  private alliances: Map<string, AllianceRecord> = new Map();

  private buildKey(name: string, tag: string): string {
    return `${name}•${tag}`;
  }

  createAlliance(name: string, tag: string): AllianceRecord {
    const key = this.buildKey(name, tag);

    const record: AllianceRecord = {
      name,
      tag,
      roles: {},
      channels: {}
    };

    this.alliances.set(key, record);
    return record;
  }

  getAlliance(name: string, tag: string): AllianceRecord | undefined {
    return this.alliances.get(this.buildKey(name, tag));
  }

  deleteAlliance(name: string, tag: string): void {
    this.alliances.delete(this.buildKey(name, tag));
  }

  getAll(): AllianceRecord[] {
    return Array.from(this.alliances.values());
  }

  exists(name: string, tag: string): boolean {
    return this.alliances.has(this.buildKey(name, tag));
  }
}

export const AllianceDB = new AllianceDatabase();