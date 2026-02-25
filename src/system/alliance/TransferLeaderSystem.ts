// ----------------- ADMIN / OWNER SET LEADER -----------------
static async setLeader(actorId: string, allianceId: string, newLeaderId: string) {
  await MutationGate.runAtomically(async () => {

    const alliance: Alliance = await AllianceService.getAllianceOrThrow(allianceId);

    const oldLeaderId = alliance.members.r5;

    // ----------------- FETCH NEW LEADER MEMBER -----------------
    const newLeaderMember = await AllianceService.fetchGuildMember(alliance.guildId, newLeaderId);
    if (!newLeaderMember) {
      throw new Error("Unable to fetch GuildMember for the new leader.");
    }

    // ----------------- CASE 1: NO CURRENT LEADER -----------------
    if (!oldLeaderId) {
      // Dowolny Discord user może zostać liderem
      await RoleModule.assignLeaderRoles(newLeaderMember, alliance.roles);
      alliance.members.r5 = newLeaderId;
      await AllianceService.updateAlliance(alliance);

      await BroadcastModule.announceLeadershipChange(allianceId, actorId, newLeaderId);
      await AllianceService.logAudit(allianceId, {
        action: "setLeader",
        actorId,
        newLeaderId
      });
      return;
    }

    // ----------------- CASE 2: CURRENT LEADER EXISTS -----------------
    // Nowy lider musi być R4
    const r4List = alliance.members.r4 || [];
    if (!r4List.includes(newLeaderId)) {
      throw new Error("New leader must be an R4 member.");
    }

    // Pobranie starego lidera
    const oldLeaderMember = await AllianceService.fetchGuildMember(alliance.guildId, oldLeaderId);
    if (!oldLeaderMember) throw new Error("Unable to fetch GuildMember for the previous leader.");

    // Assign R5 to new leader
    await RoleModule.assignLeaderRoles(newLeaderMember, alliance.roles);

    // Degradacja starego lidera do R4
    await RoleModule.assignR4Roles(oldLeaderMember, alliance.roles);

    // ----------------- UPDATE ALLIANCE STRUCTURE -----------------
    alliance.members.r4 = r4List.filter(id => id !== newLeaderId);
    alliance.members.r4.push(oldLeaderId);
    alliance.members.r5 = newLeaderId;

    await AllianceService.updateAlliance(alliance);

    // ----------------- BROADCAST + AUDIT -----------------
    await BroadcastModule.announceLeadershipChange(allianceId, actorId, newLeaderId);
    await AllianceService.logAudit(allianceId, {
      action: "setLeader",
      actorId,
      previousLeaderId: oldLeaderId,
      newLeaderId
    });
  });
}