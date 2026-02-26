// src/journal/Journal.ts
import type { JournalEntry } from './JournalTypes';

let nextId = 1;

export class Journal {
  private static entries: JournalEntry[] = [];

  /**
   * Tworzy nowy wpis w dzienniku i zwraca jego pełne dane wraz z ID
   */
  static create(entry: Omit<JournalEntry, 'id' | 'status'>): JournalEntry {
    const newEntry: JournalEntry = {
      id: nextId++,
      status: 'PENDING',
      ...entry
    };
    this.entries.push(newEntry);
    return newEntry;
  }

  /**
   * Aktualizuje status wpisu dziennika po ID
   */
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