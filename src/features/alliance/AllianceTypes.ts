export interface Alliance {
  id: string;
  name: string;

  r5: string;
  r4: string[];
  r3: string[];

  identityRoleId?: string;

  createdAt: number;
}