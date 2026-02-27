// src/index.ts
import { Client, GatewayIntentBits } from "discord.js";
import { AllianceOrkiestror } from "./orkiestror/AllianceOrkiestror";
import { AliasIntegrity } from "./integrity/AliasIntegrity";
import { MutationGate } from "./engine/MutationGate";
import { RoleModule } from "./modules/role/RoleModule";
import { ChannelModule } from "./modules/channel/ChannelModule";
import { BroadcastModule } from "./modules/broadcast/BroadcastModule";
import { RulesModule } from "./modules/rules/RulesModule";

const BOT_TOKEN = process.env.BOT_TOKEN || "";

async function bootstrap() {
  console.log("[Bootstrap] System booting...");

  // Discord client
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

  client.once("clientReady", async () => {
    console.log("[Bootstrap] Discord client started.");

    // --- Initialize alliances ---
    console.log("[Bootstrap] Initializing alliances...");

    const defaultAlliance = "alliance1";
    const defaultMember = "member1";

    // Auto-create alliance if it doesn't exist
    if (!AllianceOrkiestror.findAlliance(defaultAlliance)) {
      console.log(`[AllianceService] Auto-creating alliance ${defaultAlliance}`);
      AllianceOrkiestror.createAlliance(defaultAlliance, "AutoCreated Alliance");
    }

    // Add member
    AllianceOrkiestror.getAlliance(defaultAlliance).addMember(defaultMember);

    // Assign roles
    MutationGate.execute("ASSIGN_MEMBER_ROLES", { allianceId: defaultAlliance, memberId: defaultMember });
    RoleModule.assignMemberRoles(defaultMember, defaultAlliance);

    // Create or get channel
    ChannelModule.getAllianceChannel(defaultAlliance);

    // Broadcast join
    BroadcastModule.notifyJoin(defaultMember, defaultAlliance);

    // Transfer leadership
    MutationGate.execute("TRANSFER_LEADER", { allianceId: defaultAlliance, memberId: defaultMember });
    AllianceOrkiestror.getAlliance(defaultAlliance).transferLeader(defaultMember);

    // Validate leader
    RulesModule.validateLeaderChange(defaultMember, defaultAlliance);

    // Assign leader roles
    MutationGate.execute("ASSIGN_LEADER_ROLE", { allianceId: defaultAlliance, memberId: defaultMember });
    RoleModule.assignLeaderRole(defaultMember, defaultAlliance);

    BroadcastModule.notifyLeaderChange(defaultMember, defaultAlliance);

    // Integrity check
    console.log("[Bootstrap] Checking integrity...");
    AliasIntegrity.checkAlliance(defaultAlliance);

    console.log("[Bootstrap] System boot completed. Discord client running.");
  });

  client.login(BOT_TOKEN).catch(console.error);

  console.log("[Bootstrap] Keeping process alive...");
}

bootstrap();