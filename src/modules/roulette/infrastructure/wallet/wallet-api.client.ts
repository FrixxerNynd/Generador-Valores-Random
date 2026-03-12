import { Injectable } from '@nestjs/common';
import {
  CreditWinInput,
  DebitBetInput,
  WalletClientPort,
  WalletOperationResult,
} from '../../core/application/ports/wallet-client.port';
import { RouletteDomainError, RouletteDomainErrorCode } from '../../core/domain/errors/roulette-domain.errors';

@Injectable()
export class WalletApiClient implements WalletClientPort {
  private readonly walletBaseUrl = process.env.WALLET_API_URL;

  async debitBet(input: DebitBetInput): Promise<WalletOperationResult> {
    return this.post('/wallet/bet', input, RouletteDomainErrorCode.WALLET_DEBIT_FAILED);
  }

  async creditWin(input: CreditWinInput): Promise<WalletOperationResult> {
    return this.post('/wallet/credit', input, RouletteDomainErrorCode.WALLET_CREDIT_FAILED);
  }

  private async post(
    path: string,
    payload: object,
    errorCode: RouletteDomainErrorCode,
  ): Promise<WalletOperationResult> {
    if (!this.walletBaseUrl) {
      throw new RouletteDomainError(
        RouletteDomainErrorCode.WALLET_API_URL_MISSING,
        'No se configuró WALLET_API_URL en el entorno.',
      );
    }

    const response = await fetch(`${this.walletBaseUrl}${path}`, {
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
        {
          status: response.status,
          response: data,
        },
      );
    }

    return {
      chips: this.readChips(data),
      raw: data,
    };
  }

  private readChips(data: any): number | undefined {
    const chips = data?.wallet?.chips;
    return typeof chips === 'number' ? chips : undefined;
  }
}
