import { AllianceOrkiestror } from './orkiestror/AllianceOrkiestror';
import { RulesModule } from './modules/rules/RulesModule';
import { TransferLeaderModule } from './modules/transferleader/TransferLeaderModule';
import { RoleModule } from './modules/role/RoleModule';
import { MembershipModule } from './modules/membership/MembershipModule';

// Tworzenie sojuszu
const alliance = AllianceOrkiestror.createAlliance('alliance1');

// Dodawanie członka
MembershipModule.addMember('member1', 'alliance1', 'admin1');

// Przypisywanie ról
RoleModule.assignMemberRoles('member1', 'alliance1', 'admin1');

// Przeniesienie lidera
TransferLeaderModule.transferLeader('alliance1', 'member1', 'admin1', 'auto-promotion');

// Walidacja
RulesModule.validateJoin('member1', 'alliance1');
RulesModule.validateLeaderChange('member1', 'alliance1');

console.log('System boot completed successfully.');