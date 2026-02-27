import { Guild } from "discord.js";

export class RulesModule {
  static maxMembers = 100;       // cała pula: R5 + (R4+R3)
  static maxLeader = 1;          // lider R5
  static maxRCombined = 99;      // pula R3 + R4
  static maxR4 = 10;             // maksymalnie 10 R4

  static validateMembership(
    guild: Guild,
    targetRole: "R3" | "R4" | "R5"
  ) {
    const r5Count = guild.roles.cache.get("R5")?.members.size || 0;
    const r4Count = guild.roles.cache.get("R4")?.members.size || 0;
    const r3Count = guild.roles.cache.get("R3")?.members.size || 0;

    const combinedR3R4 = r3Count + r4Count;

    if (targetRole === "R5" && r5Count >= RulesModule.maxLeader) {
      throw new Error("W sojuszu może być tylko jeden lider (R5)");
    }

    if (targetRole === "R4" && r4Count >= RulesModule.maxR4) {
      throw new Error("R4 nie może mieć więcej niż 10 członków");
    }

    if ((targetRole === "R3" || targetRole === "R4") && combinedR3R4 >= RulesModule.maxRCombined) {
      throw new Error("Pula członków R3 + R4 została wyczerpana (max 99)");
    }

    if (r5Count + combinedR3R4 >= RulesModule.maxMembers) {
      throw new Error("Sojusz osiągnął maksymalną liczbę członków: 100");
    }
  }
}