// src/integrity/AliasIntegrity.ts
import { AllianceService } from "../AllianceService";
import { MembershipModule } from "../modules/membership/MembershipModule";
import { RoleModule } from "../modules/role/RoleModule";
import { ChannelModule } from "../modules/channel/ChannelModule";

export class AliasIntegrity {
  static checkAlliance(allianceId: string) {
    console.log(`[AliasIntegrity] checkAlliance: ${allianceId}`);
  }
}