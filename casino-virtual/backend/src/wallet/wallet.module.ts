import { Module } from '@nestjs/common';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Domain
import { WALLET_REPOSITORY } from './domain/repositories/wallet.repository.interface';

// Application
import { GetBalanceService } from './application/services/get-balance.service';
import { CreateWalletUseCase } from './application/use-cases/create-wallet.use-case';
import { DepositChipsUseCase } from './application/use-cases/deposit-chips.use-case';
import { ProcessBetUseCase } from './application/use-cases/process-bet.use-case';
import { CreditWinnerUseCase } from './application/use-cases/credit-winner.use-case';
import { WithdrawChipsUseCase } from './application/use-cases/withdraw-chips.use-case';
import { GetHistoryUseCase } from './application/use-cases/get-history.use-case';

// Infrastructure
import { WalletRepository, FIRESTORE } from './infrastructure/repositories/wallet.repository';
import { WalletController } from './infrastructure/controllers/wallet.controller';
import { WalletGateway } from './infrastructure/gateways/wallet.gateway';
import { StripeWebhookListener } from './infrastructure/listeners/stripe-webhook.listener';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const FirestoreProvider = {
  provide: FIRESTORE,
  useFactory: () => {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    return getFirestore(app);
  },
};

const WalletRepositoryProvider = {
  provide: WALLET_REPOSITORY,
  useClass: WalletRepository,
};

@Module({
  controllers: [WalletController],
  providers: [
    // Firebase
    FirestoreProvider,
    // Repository (Adapter)
    WalletRepositoryProvider,
    WalletRepository,
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
    WalletGateway,
    StripeWebhookListener,
  ],
})
export class WalletModule {}
