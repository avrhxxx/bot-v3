// src/modules/channel/ChannelModule.ts
export class ChannelModule {
  static async createChannels(_guild: any, _allianceId: string, _tag: string, _name: string) {
    console.log("[Stub] ChannelModule.createChannels wywołane");
    return {}; // zwracamy pusty obiekt zamiast prawdziwych ID
  }
}