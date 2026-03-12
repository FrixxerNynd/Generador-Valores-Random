export interface WalletOperationResult {
  chips?: number;
  raw: unknown;
}

export interface DebitBetInput {
  userId: string;
  chipsAmount: number;
  gameDescription: string;
}

export interface CreditWinInput {
  userId: string;
  chipsAmount: number;
  gameDescription: string;
}

export interface WalletClientPort {
  debitBet(input: DebitBetInput): Promise<WalletOperationResult>;
  creditWin(input: CreditWinInput): Promise<WalletOperationResult>;
}

export const WALLET_CLIENT = Symbol('WALLET_CLIENT');
