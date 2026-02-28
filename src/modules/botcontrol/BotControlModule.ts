import { Guild, Role, TextChannel, PermissionFlagsBits } from "discord.js";

export class BotControlModule {
  private delayMs: number;

  constructor(delayMs = 300) {
    this.delayMs = delayMs;
  }

  private async delay() {
    return new Promise(res => setTimeout(res, this.delayMs));
  }

  // Tworzy rolę Bot Control
  public async createRole(guild: Guild, name: string, color: number): Promise<Role> {
    const role = await guild.roles.create({ name, color });
    await this.delay();
    return role;
  }

  // Tworzy kanał systemowy
  public async createTextChannel(guild: Guild, name: string, permissionOverwrites?: any[]): Promise<TextChannel> {
    const channel = await guild.channels.create({
      name,
      type: 0, // GuildText
      permissionOverwrites
    }) as TextChannel;
    await this.delay();
    return channel;
  }

  // Przydziela rolę użytkownikowi
  public async assignRole(member: any, roleId: string) {
    await member.roles.add(roleId);
    await this.delay();
  }

  // Usuwa rolę użytkownikowi
  public async removeRole(member: any, roleId: string) {
    await member.roles.remove(roleId);
    await this.delay();
  }
}