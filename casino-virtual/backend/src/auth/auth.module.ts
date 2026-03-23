// ─── auth/auth.module.ts ──────────────────────────────────────────────────────
// WalletModule ya NO se importa aquí.
// En su lugar se registra WalletApiClient como implementación del puerto
// WALLET_CLIENT_PORT, de modo que Auth se comunica con Wallet únicamente
// a través de llamadas HTTP (igual que lo haría un microservicio externo).

import { Injectable, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import {
  getApp,
  getApps,
  initializeApp,
  cert,
  applicationDefault,
  type ServiceAccount,
} from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Domain
import { IAuthRepository } from './domain/auth.repository.interface';
import { User } from './domain/user.entity';

// Application
import { LoginUseCase } from './aplication/login.use-case';
import { RegisterUseCase } from './aplication/register.use-case';
import { UpdateUserUseCase } from './aplication/update-user.use-case';

// Infrastructure
import { AuthController } from './infraestructure/auth.controller';
import { BcryptAdapter } from './infraestructure/adapters/bcrypt.adapter';
import { JwtAdapter } from './infraestructure/adapters/jwt.adapter';
import { JwtAuthGuard } from './infraestructure/guards/jwt-auth.guard';
import {
  FirebaseAuthRepository,
  FIRESTORE_AUTH,
} from './infraestructure/repositories/firebase-auth.repository';

// Wallet integration — sólo el puerto y su cliente HTTP
import { WalletApiClient } from './infraestructure/adapters/wallet-api.client';

// ── InMemory fallback ─────────────────────────────────────────────────────────

// ── Firebase Firestore provider ───────────────────────────────────────────────
const parseServiceAccountFromEnv = (): ServiceAccount | null => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const projectId = parsed.projectId ?? parsed.project_id;
    const clientEmail = parsed.clientEmail ?? parsed.client_email;
    const privateKeyRaw = parsed.privateKey ?? parsed.private_key;

    if (!projectId || !clientEmail || !privateKeyRaw) {
      console.warn(
        '⚠️ FIREBASE_SERVICE_ACCOUNT_JSON incompleto (faltan projectId/clientEmail/privateKey).',
      );
      return null;
    }

    return {
      projectId,
      clientEmail,
      privateKey: privateKeyRaw.replace(/\\n/g, '\n'),
    };
  } catch (error) {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_JSON inválido. Error:', error);
    return null;
  }
};

const hasFirebaseAdminCredentials = (): boolean => {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
};

const createFirebaseAdminApp = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const serviceAccount = parseServiceAccountFromEnv();

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId ?? projectId,
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  }

  return initializeApp({ projectId });
};

const FirestoreAuthProvider = {
  provide: FIRESTORE_AUTH,
  useFactory: () => {
    const app = getApps().length === 0 ? createFirebaseAdminApp() : getApp();
    return getFirestore(app);
  },
};

// ── Módulo ────────────────────────────────────────────────────────────────────
@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'SECRETDEVUTD',
      signOptions: { expiresIn: '1h' },
    }),

    // ✅ WalletModule ya NO se importa — la comunicación es por HTTP
  ],
  controllers: [AuthController],
  providers: [
    // ── Firebase ──────────────────────────────────────────────────────────────
    FirestoreAuthProvider,
    FirebaseAuthRepository,

    // ── IAuthRepository (Firebase o InMemory según entorno) ──────────────────
    {
      provide: 'IAuthRepository',
      useFactory: (
        firebaseRepo: FirebaseAuthRepository
      ) => {
        if (process.env.FIREBASE_PROJECT_ID && hasFirebaseAdminCredentials()) {
          console.log('✅ Usando Firebase Auth Repository');
          return firebaseRepo;
        }
          throw new Error('❌ Firebase Admin no configurado: faltan credenciales. No se permite fallback a memoria.');
      },
      inject: [FirebaseAuthRepository],
    },

    // ── Wallet client (HTTP) ──────────────────────────────────────────────────
    // WalletApiClient se instancia aquí y queda asociado al token WALLET_CLIENT_PORT.
    // RegisterUseCase lo inyecta con @Inject(WALLET_CLIENT_PORT).
    WalletApiClient,
    {
      provide: 'WALLET_CLIENT_PORT',
      useExisting: WalletApiClient
    },
    {
      provide: 'IWalletApiClient',
      useClass: WalletApiClient,
    },

    // ── Use Cases ─────────────────────────────────────────────────────────────
    LoginUseCase,
    RegisterUseCase,
    UpdateUserUseCase,

    // ── Adapters & Guards ─────────────────────────────────────────────────────
    JwtAdapter,
    JwtAuthGuard,
    { provide: 'IPasswordHasher', useClass: BcryptAdapter },
  ],
  exports: [
    JwtModule,
    JwtAdapter,
    'IAuthRepository',
    JwtAuthGuard,
    FirebaseAuthRepository,
  ],
})
export class AuthModule {}
