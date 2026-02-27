export class RulesModule {
  private leaderCount = 0;

  canPromoteToLeader(): boolean {
    return this.leaderCount === 0;
  }

  addLeader() {
    if (!this.canPromoteToLeader()) {
      throw new Error("There is already a leader in the alliance");
    }
    this.leaderCount++;
  }

  removeLeader() {
    if (this.leaderCount > 0) this.leaderCount--;
  }
}