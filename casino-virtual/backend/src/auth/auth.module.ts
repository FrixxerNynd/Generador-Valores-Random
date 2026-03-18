import { Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import {
  getApp,
  getApps,
  initializeApp,
  cert,
  applicationDefault,
} from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { LoginUseCase } from './aplication/login.use-case';
import { RegisterUseCase } from './aplication/register.use-case';
import { UpdateUserUseCase } from './aplication/update-user.use-case';
import { AuthController } from './infraestructure/auth.controller';
import { BcryptAdapter } from './infraestructure/adapters/bcrypt.adapter';
import { JwtAdapter } from './infraestructure/adapters/jwt.adapter';
import { JwtAuthGuard } from './infraestructure/guards/jwt-auth.guard';
import { IAuthRepository } from './domain/auth.repository.interface';
import { User } from './domain/user.entity';
import { WalletModule } from '../wallet/wallet.module';
import {
  FirebaseAuthRepository,
  FIRESTORE_AUTH,
} from './infraestructure/repositories/firebase-auth.repository';

// InMemory Repository (fallback cuando no hay Firebase)
@Injectable()
export class InMemoryAuthRepository implements IAuthRepository {
  private users: Map<string, User> = new Map();

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(
      Array.from(this.users.values()).find((u) => u.email === email) || null,
    );
  }

  findByNickname(nickname: string): Promise<User | null> {
    return Promise.resolve(
      Array.from(this.users.values()).find((u) => u.nickname === nickname) ||
        null,
    );
  }

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.get(id) || null);
  }

  save(user: User): Promise<void> {
    this.users.set(user.id, user);
    return Promise.resolve();
  }

  update(user: User): Promise<void> {
    this.users.set(user.id, user);
    return Promise.resolve();
  }

  delete(id: string): Promise<void> {
    this.users.delete(id);
    return Promise.resolve();
  }

  clearAll(): void {
    this.users.clear();
  }
}

const FirestoreAuthProvider = {
  provide: FIRESTORE_AUTH,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const projectId = configService.get<string>('FIREBASE_PROJECT_ID');
    const serviceAccountJson = configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT_JSON',
    );

    // If firebase isn't configured, provide a stub
    if (!projectId && !serviceAccountJson) {
      return {} as Firestore;
    }

    const app =
      getApps().length > 0
        ? getApp()
        : initializeApp({
            projectId,
            credential: serviceAccountJson
              ? cert(JSON.parse(serviceAccountJson))
              : applicationDefault(),
          });

    return getFirestore(app);
  },
};

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: 'SECRETDEVUTD',
      signOptions: { expiresIn: '1h' },
    }),
    WalletModule,
  ],
  controllers: [AuthController],
  providers: [
    // Firebase
    FirestoreAuthProvider,
    // InMemory Repository (fallback cuando no hay Firebase)
    InMemoryAuthRepository,
    // Repository - usa Firebase si está disponible, si no usa InMemory
    FirebaseAuthRepository,
    {
      provide: 'IAuthRepository',
      useFactory: (
        firebaseRepo: FirebaseAuthRepository,
        inMemoryRepo: InMemoryAuthRepository,
      ) => {
        // Verificar si Firestore está configurado
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

        if (projectId && serviceAccount) {
          console.log('✅ Usando Firebase Auth Repository');
          return firebaseRepo;
        } else {
          console.log(
            '⚠️ Firebase no configurado. Usando repositorio en memoria',
          );
          return inMemoryRepo;
        }
      },
      inject: [FirebaseAuthRepository, InMemoryAuthRepository],
    },
    // Use Cases
    LoginUseCase,
    RegisterUseCase,
    UpdateUserUseCase,
    // Adapters & Guards
    JwtAdapter,
    JwtAuthGuard,
    { provide: 'IPasswordHasher', useClass: BcryptAdapter },
  ],
  exports: [
    'IAuthRepository',
    JwtAuthGuard,
    FirebaseAuthRepository,
    InMemoryAuthRepository,
  ],
})
export class AuthModule {}
