type Collection<T> = Map<string, T>;

export class Database {
  private static instance: Database;

  public alliances: Collection<any> = new Map();
  public journal: Collection<any> = new Map();
  public ownership: Collection<any> = new Map();
  public health: Collection<any> = new Map();

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}