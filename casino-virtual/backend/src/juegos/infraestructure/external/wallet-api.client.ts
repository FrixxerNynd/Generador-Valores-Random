import { Injectable } from '@nestjs/common';
import {
  WalletClientPort,
  WalletCreditInput,
  WalletDebitInput,
} from '../../aplication/ports/wallet-client.port';
import { RouletteDomainError, RouletteDomainErrorCode } from '../../domian/errors/roulette-domain.errors';

@Injectable()
export class WalletApiClient implements WalletClientPort {
  private readonly walletApiUrl = process.env.WALLET_API_URL ?? 'http://localhost:3000';

  async debit(input: WalletDebitInput): Promise<unknown> {
    return this.post('/wallet/bet', input, RouletteDomainErrorCode.WALLET_DEBIT_FAILED);
  }

  async credit(input: WalletCreditInput): Promise<unknown> {
    return this.post('/wallet/credit', input, RouletteDomainErrorCode.WALLET_CREDIT_FAILED);
  }

  private async post(path: string, payload: object, errorCode: RouletteDomainErrorCode): Promise<unknown> {
    const response = await fetch(`${this.walletApiUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new RouletteDomainError(
        errorCode,
        'Wallet API rechazó la operación.',
        { status: response.status, response: data },
      );
    }

    return data;
  }
}
