import crypto from "crypto";
import { JournalEntry, JournalStatus } from "./JournalTypes";
import { JournalRepo } from "../data/Repositories";

export class Journal {
  static create(entry: Omit<JournalEntry, "id" | "timestamp" | "status">): JournalEntry {
    const id = crypto.randomUUID();

    const fullEntry: JournalEntry = {
      ...entry,
      id,
      timestamp: Date.now(),
      status: "PENDING"
    };

    JournalRepo.set(id, fullEntry);

    return fullEntry;
  }

  static updateStatus(id: string, status: JournalStatus) {
    const entry = JournalRepo.get(id);
    if (!entry) throw new Error("Journal entry not found");

    entry.status = status;
    JournalRepo.set(id, entry);
  }

  static get(id: string): JournalEntry | undefined {
    return JournalRepo.get(id);
  }

  static computeHash(data: unknown): string {
    const serialized = JSON.stringify(data);
    return crypto.createHash("sha256").update(serialized).digest("hex");
  }
}