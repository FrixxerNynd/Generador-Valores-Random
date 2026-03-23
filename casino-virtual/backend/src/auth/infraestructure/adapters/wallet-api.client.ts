import { Injectable } from '@nestjs/common';
import { WalletApiClientPort } from '../ports/wallet-api-client.port';

@Injectable()
export class WalletApiClient implements WalletApiClientPort {
  private readonly walletApiUrl =
    process.env.WALLET_API_URL ?? 'http://localhost:3000/api';

  async createWallet(userId: string): Promise<unknown> {
    const response = await fetch(`${this.walletApiUrl}/wallet/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // No lanzamos excepción fatal: si la wallet ya existe o el servicio falla
      // no debe bloquear el registro del usuario. Solo logueamos el error.
      console.error(
        `[WalletApiClient] Error al crear wallet para usuario ${userId}:`,
        { status: response.status, response: data },
      );
      return null;
    }

    return data;
  }
}
