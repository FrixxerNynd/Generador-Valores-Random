import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LoginUseCase } from '../../src/auth/aplication/login.use-case';
import { RegisterUseCase } from '../../src/auth/aplication/register.use-case';
import { UpdateUserUseCase } from '../../src/auth/aplication/update-user.use-case';
import { AuthController } from '../../src/auth/infraestructure/auth.controller';
import { BcryptAdapter } from '../../src/auth/infraestructure/adapters/bcrypt.adapter';
import { JwtAdapter } from '../../src/auth/infraestructure/adapters/jwt.adapter';
import { JwtAuthGuard } from '../../src/auth/infraestructure/guards/jwt-auth.guard';
import { Injectable } from '@nestjs/common';
import { IAuthRepository } from '../../src/auth/domain/auth.repository.interface';
import { User } from './domain/user.entity';

@Injectable()
export class InMemoryAuthRepository implements IAuthRepository {
  private users: Map<string, User> = new Map();

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(
      Array.from(this.users.values()).find((u) => u.email === email) || null,
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

@Module({
  imports: [
    JwtModule.register({
      secret: 'SECRETDEVUTD',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RegisterUseCase,
    UpdateUserUseCase,
    JwtAdapter,
    JwtAuthGuard,
    { provide: 'IPasswordHasher', useClass: BcryptAdapter },
    { provide: 'IAuthRepository', useClass: InMemoryAuthRepository },
  ],
  exports: [JwtAuthGuard, InMemoryAuthRepository],
})
export class AuthModule {}
