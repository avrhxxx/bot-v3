export interface Alliance {
  id: string;
  name: string;

  r5: string;          // leader
  r4: string[];        // moderators
  r3: string[];        // members

  identityRoleId?: string;

  createdAt: number;
}