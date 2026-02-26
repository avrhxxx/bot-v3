// src/journal/Journal.ts
import type { JournalEntry } from './JournalTypes';

export class Journal {
  private entries: JournalEntry[] = [];

  log(entry: JournalEntry) {
    this.entries.push(entry);
  }

  getAll(): JournalEntry[] {
    return this.entries;
  }
}