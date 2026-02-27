import { Guild, GuildMember } from "discord.js";
import { RoleModule } from "../modules/role/RoleModule";
import { ChannelModule } from "../modules/channel/ChannelModule";
import { RulesModule } from "../modules/rules/RulesModule";

export class AllianceOrkiestror {
  private roleModule: RoleModule;
  private channelModule: ChannelModule;
  private rulesModule: RulesModule;

  constructor(private guild: Guild) {
    this.roleModule = new RoleModule(guild);
    this.channelModule = new ChannelModule(guild);
    this.rulesModule = new RulesModule();
  }

  /** Minimalny flow: tworzymy role, kanały i przypisujemy lidera */
  async setupAlliance(allianceName: string, leader: GuildMember) {
    // 1️⃣ Tworzymy role
    await this.roleModule.createRoles();

    // 2️⃣ Tworzymy kategorię i kanały
    const category = await this.channelModule.createAllianceCategory(allianceName);
    await this.channelModule.createAllianceChannels(category);

    // 3️⃣ Walidacja i przypisanie lidera
    if (!this.rulesModule.canPromoteToLeader()) {
      throw new Error("Alliance already has a leader");
    }
    this.rulesModule.addLeader();
    await this.roleModule.assignRole(leader, "R5 - Leader");
  }
}