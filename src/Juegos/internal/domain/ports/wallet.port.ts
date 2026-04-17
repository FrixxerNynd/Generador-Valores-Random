export interface WalletPort {
  getBalance(accessToken: string): Promise<number>;
  debit(accessToken: string, amount: number, gameDescription: string): Promise<boolean>;
  credit(accessToken: string, amount: number, gameDescription: string): Promise<boolean>;
}

export const WALLET_PORT = Symbol('WalletPort');
