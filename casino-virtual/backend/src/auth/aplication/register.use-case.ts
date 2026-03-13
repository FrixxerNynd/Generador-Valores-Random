import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import type { IAuthRepository } from '../domain/auth.repository.interface';
import type { IPasswordHasher } from '../domain/password-hasher.interface';
import { User } from '../domain/user.entity';
import { generateId } from '../../shared/utils/id.generator';
import { CreateWalletUseCase } from '../../wallet/application/use-cases/create-wallet.use-case';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
    @Inject('IPasswordHasher')
    private readonly passwordHasher: IPasswordHasher,
    private readonly createWalletUseCase: CreateWalletUseCase,
  ) {}

  async execute(
    name: string,
    lastName: string,
    email: string,
    password: string,
  ): Promise<{
    id: string;
    email: string;
    name: string;
    wallet: { coins: number; credits: number };
  }> {
    try {
      // Verificar si el email ya existe
      const existingUser = await this.authRepository.findByEmail(email);
      if (existingUser) {
        throw new BadRequestException(
          'El correo electrónico ya está registrado',
        );
      }

      // Hashear la contraseña
      const passwordHash = await this.passwordHasher.hash(password);

      // Crear nuevo usuario con rol por defecto 'user'
      const userId = generateId();
      const newUser = new User(
        userId,
        name,
        lastName,
        email,
        passwordHash,
        ['user'], // Rol por defecto
        true, // isActive por defecto
      );

      // Guardar el usuario
      await this.authRepository.save(newUser);

      // Crear wallet automáticamente con saldo inicial
      // Coins = 0, Credits = 100 (créditos de bienvenida)
      await this.createWalletUseCase.execute({ userId });

      return {
        id: userId,
        email: newUser.email,
        name: newUser.name,
        wallet: { coins: 0, credits: 100 },
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Error al registrar el usuario');
    }
  }
}
