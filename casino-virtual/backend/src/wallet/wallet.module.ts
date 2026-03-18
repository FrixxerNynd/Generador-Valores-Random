import { Module, Injectable } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  getApp,
  getApps,
  initializeApp,
  cert,
  applicationDefault,
} from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Domain
import {
  WALLET_REPOSITORY,
  IWalletRepository,
  HistoryFilters,
} from './domain/repositories/wallet.repository.interface';
import { WalletEntity } from './domain/entities/wallet.entity';
import { TransactionEntity } from './domain/entities/transaction.entity';

// Application
import { GetBalanceService } from './application/services/get-balance.service';
import { CreateWalletUseCase } from './application/use-cases/create-wallet.use-case';
import { DepositChipsUseCase } from './application/use-cases/deposit-chips.use-case';
import { ProcessBetUseCase } from './application/use-cases/process-bet.use-case';
import { CreditWinnerUseCase } from './application/use-cases/credit-winner.use-case';
import { WithdrawChipsUseCase } from './application/use-cases/withdraw-chips.use-case';
import { GetHistoryUseCase } from './application/use-cases/get-history.use-case';

// Infrastructure
import {
  WalletRepository,
  FIRESTORE,
} from './infrastructure/repositories/wallet.repository';
import { WalletController } from './infrastructure/controllers/wallet.controller';
import { WalletGateway } from './infrastructure/gateways/wallet.gateway';
import { StripeWebhookListener } from './infrastructure/listeners/stripe-webhook.listener';

// InMemory Wallet Repository (fallback cuando no hay Firebase)
@Injectable()
export class InMemoryWalletRepository implements IWalletRepository {
  private wallets: Map<string, WalletEntity> = new Map();
  private transactions: Map<string, TransactionEntity> = new Map();

  async findByUserId(userId: string): Promise<WalletEntity | null> {
    const wallet = Array.from(this.wallets.values()).find(
      (w) => w.userId === userId,
    );
    return Promise.resolve(wallet || null);
  }

  async create(wallet: WalletEntity): Promise<WalletEntity> {
    this.wallets.set(wallet.id, wallet);
    return Promise.resolve(wallet);
  }

  async update(wallet: WalletEntity): Promise<WalletEntity> {
    this.wallets.set(wallet.id, wallet);
    return Promise.resolve(wallet);
  }

  async saveTransaction(
    transaction: TransactionEntity,
  ): Promise<TransactionEntity> {
    this.transactions.set(transaction.id, transaction);
    return Promise.resolve(transaction);
  }

  async getTransactionsByUserId(
    userId: string,
    filters?: HistoryFilters,
  ): Promise<TransactionEntity[]> {
    let transactions = Array.from(this.transactions.values()).filter(
      (t) => t.userId === userId,
    );

    if (filters) {
      if (filters.action) {
        transactions = transactions.filter((t) => t.action === filters.action);
      }
      if (filters.currencyType) {
        transactions = transactions.filter(
          (t) => t.currencyType === filters.currencyType,
        );
      }
      if (filters.from) {
        transactions = transactions.filter((t) => t.date >= filters.from!);
      }
      if (filters.to) {
        transactions = transactions.filter((t) => t.date <= filters.to!);
      }
    }

    const result = transactions.sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
    return Promise.resolve(result);
  }

  async getAllTransactions(): Promise<TransactionEntity[]> {
    const transactions = Array.from(this.transactions.values());
    const result = transactions.sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
    return Promise.resolve(result);
  }

  clearAll(): void {
    this.wallets.clear();
    this.transactions.clear();
  }
}

const FirestoreProvider = {
  provide: FIRESTORE,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const projectId = configService.get<string>('FIREBASE_PROJECT_ID');
    const serviceAccountJson = configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT_JSON',
    );

    // If firebase isn't configured (e.g., during isolated unit tests), provide a stub so the app can start.
    if (!projectId && !serviceAccountJson) {
      return {} as Firestore;
    }

    const app =
      getApps().length > 0
        ? getApp()
        : initializeApp({
            projectId,
            // Prefer explicit service account JSON if provided (useful for local dev).
            credential: serviceAccountJson
              ? cert(JSON.parse(serviceAccountJson))
              : applicationDefault(),
          });

    return getFirestore(app);
  },
};

@Module({
  imports: [ConfigModule],
  controllers: [WalletController],
  providers: [
    // Firebase
    FirestoreProvider,
    // InMemory Repository (fallback cuando no hay Firebase)
    InMemoryWalletRepository,
    // Repository - usa Firebase si está disponible, si no usa InMemory
    WalletRepository,
    {
      provide: WALLET_REPOSITORY,
      useFactory: (
        walletRepo: WalletRepository,
        inMemoryRepo: InMemoryWalletRepository,
      ) => {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

        if (projectId && serviceAccount) {
          console.log('✅ Usando Firebase Wallet Repository');
          return walletRepo;
        } else {
          console.log('⚠️ Firebase no configurado. Usando wallet en memoria');
          return inMemoryRepo;
        }
      },
      inject: [WalletRepository, InMemoryWalletRepository],
    },
    // Application — use cases
    CreateWalletUseCase,
    GetBalanceService,
    DepositChipsUseCase,
    ProcessBetUseCase,
    CreditWinnerUseCase,
    WithdrawChipsUseCase,
    GetHistoryUseCase,
    // Infrastructure
    WalletGateway,
    StripeWebhookListener,
  ],
  exports: [
    CreateWalletUseCase,
    ProcessBetUseCase,
    CreditWinnerUseCase,
    GetBalanceService,
    GetHistoryUseCase,
    WalletGateway,
    StripeWebhookListener,
    InMemoryWalletRepository,
  ],
})
export class WalletModule {}
