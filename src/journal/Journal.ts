
// src/journal/Journal.ts
import type { JournalEntry } from './JournalTypes';

export class Journal {
  private static entries: JournalEntry[] = [];

  static create(entry: JournalEntry) {
    this.entries.push(entry);
  }

  static updateStatus(index: number, status: string) {
    if (this.entries[index]) {
      this.entries[index].status = status;
    }
  }

  static getAll(): JournalEntry[] {
    return this.entries;
  }
}