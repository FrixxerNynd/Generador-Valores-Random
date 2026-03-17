export interface HistoryPort {
  saveRecord(userId: string, game: string, betAmount: number, winAmount: number, detail: string): Promise<void>;
}

export const HISTORY_PORT = Symbol('HistoryPort');
