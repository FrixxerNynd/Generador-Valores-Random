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
import * as walletApiClientPort from '../infraestructure/ports/wallet-api-client.port';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
    @Inject('IPasswordHasher')
    private readonly passwordHasher: IPasswordHasher,
    @Inject('IWalletApiClient')
    private readonly walletApiClient: walletApiClientPort.WalletApiClientPort,
  ) {}

  async execute(
    name: string,
    last_name: string,
    nickname: string,
    born_date: Date | string,
    email: string,
    password: string,
  ): Promise<{
    id: string;
    email: string;
    name: string;
    nickname: string;
    wallet: { chips: number; money: number };
  }> {
    try {
      // Verificar si el email ya existe
      const existingUser = await this.authRepository.findByEmail(email);
      if (existingUser) {
        throw new BadRequestException(
          'El correo electrónico ya está registrado',
        );
      }

      // Verificar si el nickname ya existe
      const existingNickname =
        await this.authRepository.findByNickname(nickname);
      if (existingNickname) {
        throw new BadRequestException('El nickname ya está en uso');
      }

      // Hashear la contraseña
      const passwordHash = await this.passwordHasher.hash(password);

      const normalizedBornDate =
        born_date instanceof Date ? born_date : new Date(born_date);

      if (Number.isNaN(normalizedBornDate.getTime())) {
        throw new BadRequestException(
          'La fecha de nacimiento debe ser una fecha válida',
        );
      }

      // Crear nuevo usuario con rol por defecto 'user' y status true
      const userId = generateId();
      const newUser = new User(
        userId,
        name,
        last_name,
        nickname,
        normalizedBornDate,
        email,
        passwordHash,
        'user',   // Rol por defecto
        true,     // Status activo por defecto
      );

      // Guardar el usuario
      await this.authRepository.save(newUser);

      // Crear wallet automáticamente llamando al servicio de wallet vía API
      await this.walletApiClient.createWallet(userId);

      return {
        id: userId,
        email: newUser.email,
        name: newUser.name,
        nickname: newUser.nickname,
        wallet: { chips: 0, money: 0 },
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) throw error;
      console.error('[RegisterUseCase] Error inesperado:', error);
      throw new InternalServerErrorException('Error al registrar el usuario');
    }
  }
}
