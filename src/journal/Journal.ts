import type { JournalEntry } from './JournalTypes';

let nextId = 1;
export class Journal {
  private static entries: JournalEntry[] = [];

  static create(entry: Omit<JournalEntry, 'id' | 'status'>): JournalEntry {
    const newEntry: JournalEntry = { id: nextId++, status: 'PENDING', ...entry };
    this.entries.push(newEntry);
    return newEntry;
  }

  static updateStatus(id: number, status: string, errorMessage?: string) {
    const entry = this.entries.find(e => e.id === id);
    if (entry) {
      entry.status = status;
      if (errorMessage) entry.error = errorMessage;
    }
  }

  static getAll(): JournalEntry[] {
    return this.entries;
  }
}