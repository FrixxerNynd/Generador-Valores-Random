import { Injectable, Inject } from '@nestjs/common';
import { WalletPort } from '../../domain/ports/wallet.port';

@Injectable()
export class WalletApiAdapter implements WalletPort {
  private readonly baseUrl = process.env.WALLET_SERVICE_URL || 'http://localhost:3000/api'; // Host local:3000/api, wallet-service:3000/api en Docker

  async getBalance(userId: string): Promise<number> {
    const response = await fetch(`${this.baseUrl}/wallet/${userId}`);
    if (!response.ok) {
      if (response.status === 404) {
        return 0; // Si el usuario no tiene wallet, asumimos balance 0
      }
      throw new Error(`Error de Wallet API: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    // El endpoint retorna saldo + historial, el campo es "chips"
    return data.wallet?.chips ?? data.chips ?? 0;
  }

  async debit(userId: string, amount: number, gameDescription: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/wallet/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        chipsAmount: amount,           // ← campo correcto
        gameDescription,
      }),
    });
    return response.ok;
  }

  async credit(userId: string, amount: number, gameDescription: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/wallet/credit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        chipsAmount: amount,           // ← campo correcto
        gameDescription,
      }),
    });
    return response.ok;
  }
}