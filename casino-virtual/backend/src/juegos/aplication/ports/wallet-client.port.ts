export interface WalletDebitInput {
  userId: string;
  chipsAmount: number;
  gameDescription: string;
}

export interface WalletCreditInput {
  userId: string;
  chipsAmount: number;
  gameDescription: string;
}

export interface WalletClientPort {
  debit(input: WalletDebitInput): Promise<unknown>;
  credit(input: WalletCreditInput): Promise<unknown>;
}

export const WALLET_CLIENT = Symbol('WALLET_CLIENT');
