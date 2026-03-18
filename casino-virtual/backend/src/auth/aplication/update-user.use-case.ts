import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { IAuthRepository } from '../domain/auth.repository.interface';
import type { IPasswordHasher } from '../domain/password-hasher.interface';
import { User } from '../domain/user.entity';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('IAuthRepository') private readonly authRepository: IAuthRepository,
    @Inject('IPasswordHasher') private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(
    userId: string,
    updates: {
      name?: string;
      last_name?: string;
      nickname?: string;
      email?: string;
      password?: string;
    },
  ): Promise<{ id: string; email: string; name: string; nickname: string }> {
    // Obtener usuario existente
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar si el nuevo email ya existe en otro usuario
    if (updates.email && updates.email !== user.email) {
      const existingUser = await this.authRepository.findByEmail(updates.email);
      if (existingUser) {
        throw new BadRequestException('El correo electrónico ya está en uso');
      }
    }

    // Validar si el nuevo nickname ya existe en otro usuario
    if (updates.nickname && updates.nickname !== user.nickname) {
      const existingNickname = await this.authRepository.findByNickname(
        updates.nickname,
      );
      if (existingNickname) {
        throw new BadRequestException('El nickname ya está en uso');
      }
    }

    // Preparar los datos actualizados
    let passwordHash = user.password;
    if (updates.password) {
      passwordHash = await this.passwordHasher.hash(updates.password);
    }

    // Crear usuario actualizado
    const updatedUser = new User(
      user.id,
      updates.name || user.name,
      updates.last_name || user.last_name,
      updates.nickname || user.nickname,
      user.born_date,
      updates.email || user.email,
      passwordHash,
      user.role,
      user.status,
    );

    // Guardar cambios
    await this.authRepository.update(updatedUser);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      nickname: updatedUser.nickname,
    };
  }
}
