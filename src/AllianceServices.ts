import { Alliance, Member } from './AllianceTypes';

export class AllianceService {
  private static alliances: Map<string, Alliance> = new Map();

  static getAlliance(id: string): Alliance | undefined {
    return this.alliances.get(id);
  }

  static addMember(allianceId: string, memberId: string) {
    const alliance = this.alliances.get(allianceId);
    if (!alliance) return;
    alliance.members.push({ id: memberId, role: 'Identity' });
    console.log(`[AllianceService] Member added: ${memberId} to ${allianceId}`);
  }

  static removeMember(allianceId: string, memberId: string) {
    const alliance = this.alliances.get(allianceId);
    if (!alliance) return;
    alliance.members = alliance.members.filter(m => m.id !== memberId);
    console.log(`[AllianceService] Member removed: ${memberId} from ${allianceId}`);
  }
}