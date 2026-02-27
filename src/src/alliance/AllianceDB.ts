// -------------------
// Alliance Database (PseudoDB)
// -------------------
export class AllianceDB {
  public roles: Record<string, string> = {};
  public category?: string;
  public channels: Record<string, string> = {};

  // resetowanie całej bazy
  reset() {
    this.roles = {};
    this.category = undefined;
    this.channels = {};
  }
}

// singleton do użycia w całym serwisie
export const allianceDB = new AllianceDB();