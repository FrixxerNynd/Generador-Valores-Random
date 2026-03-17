export interface WalletPort {
  getBalance(userId: string): Promise<number>;
  debit(userId: string, amount: number, gameDescription: string): Promise<boolean>;
  credit(userId: string, amount: number, gameDescription: string): Promise<boolean>;
}

export const WALLET_PORT = Symbol('WalletPort');
