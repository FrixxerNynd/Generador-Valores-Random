import { WalletEntity } from '../entities/wallet.entity';
import { TransactionEntity, TransactionAction, CurrencyType } from '../entities/transaction.entity';

export const WALLET_REPOSITORY = 'WALLET_REPOSITORY';

export interface HistoryFilters {
  action?: TransactionAction;
  currencyType?: CurrencyType;
  from?: Date;
  to?: Date;
}

export interface IWalletRepository {
  findByUserId(userId: string): Promise<WalletEntity | null>;
  create(wallet: WalletEntity): Promise<WalletEntity>;
  update(wallet: WalletEntity): Promise<WalletEntity>;
  saveTransaction(transaction: TransactionEntity): Promise<TransactionEntity>;
  getTransactionsByUserId(userId: string, filters?: HistoryFilters): Promise<TransactionEntity[]>;
}
