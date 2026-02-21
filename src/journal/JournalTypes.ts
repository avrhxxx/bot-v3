import crypto from "crypto";
import { JournalEntry, JournalStatus } from "./JournalTypes";
import { db } from "../data/Database";

export class Journal {
  static create(entry: Omit<JournalEntry, "id" | "status">): JournalEntry {
    const id = crypto.randomUUID();

    const fullEntry: JournalEntry = {
      ...entry,
      id,
      status: "PENDING"
    };

    db.journal.set(id, fullEntry);
    return fullEntry;
  }

  static updateStatus(id: string, status: JournalStatus, error?: string) {
    const entry = db.journal.get(id);
    if (!entry) return;

    entry.status = status;

    if (error) {
      entry.error = error;
    }

    db.journal.set(id, entry);
  }

  static getAll(): JournalEntry[] {
    return Array.from(db.journal.values());
  }
}