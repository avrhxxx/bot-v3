// src/modules/rules/RulesModule.ts
export class RulesModule {
  static canPromoteToLeader(_memberId: string) {
    console.log("[Stub] RulesModule.canPromoteToLeader wywołane");
    return true; // na razie zawsze true
  }
}