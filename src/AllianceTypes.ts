export interface Member {
  id: string;
  role: 'R5' | 'R4' | 'R3' | 'Identity';
}

export interface Alliance {
  id: string;
  name: string;
  members: Member[];
}