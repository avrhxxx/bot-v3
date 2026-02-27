// src/data/Database.ts
export interface Alliance {
  id: string;
  name: string;
  members: string[];
  leader?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AllianceAudit {
  allianceId: string;
  action: string;
  actor: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export class Database {
  public alliances: Map<string, Alliance> = new Map();
  public audits: AllianceAudit[] = [];
}

export const db = new Database();