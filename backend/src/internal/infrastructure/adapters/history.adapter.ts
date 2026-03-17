import { Injectable, Inject } from '@nestjs/common';
import { HistoryPort, HISTORY_PORT } from '../../domain/ports/history.port';

@Injectable()
export class HistoryAdapter implements HistoryPort {
  private readonly baseUrl = process.env.HISTORY_SERVICE_URL || 'http://localhost:3002/api';

  async saveRecord(userId: string, game: string, betAmount: number, winAmount: number, detail: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          game,
          betAmount,
          winAmount,
          detail,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.warn('[HISTORY] Fallo al guardar registro:', response.status);
      }
    } catch (error) {
      console.error('[HISTORY] Error de conexión:', error);
    }
  }
}
