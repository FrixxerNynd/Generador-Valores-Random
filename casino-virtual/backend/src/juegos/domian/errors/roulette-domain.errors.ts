export enum RouletteDomainErrorCode {
  INVALID_RANGE = 'INVALID_RANGE',
  INVALID_SELECTED_NUMBER = 'INVALID_SELECTED_NUMBER',
  INVALID_BET_AMOUNT = 'INVALID_BET_AMOUNT',
  WALLET_DEBIT_FAILED = 'WALLET_DEBIT_FAILED',
  WALLET_CREDIT_FAILED = 'WALLET_CREDIT_FAILED',
}

export class RouletteDomainError extends Error {
  constructor(
    public readonly code: RouletteDomainErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'RouletteDomainError';
  }
}
