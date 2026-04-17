export interface WalletApiClientPort {
  createWallet(userId: string): Promise<unknown>;
}
