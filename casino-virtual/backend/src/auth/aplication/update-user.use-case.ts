import {
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
    private readonly authRepository: IAuthRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(
    userId: string,
    updates: {
      name?: string;
      lastName?: string;
      email?: string;
      password?: string;
    },
  ): Promise<{ id: string; email: string; name: string }> {
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

    // Preparar los datos actualizados
    let passwordHash = user.passwordHash;
    if (updates.password) {
      passwordHash = await this.passwordHasher.hash(updates.password);
    }

    // Crear usuario actualizado
    const updatedUser = new User(
      user.id,
      updates.name || user.name,
      updates.lastName || user.lastName,
      updates.email || user.email,
      passwordHash,
      user.roles,
      user.isActive,
    );

    // Guardar cambios
    await this.authRepository.update(updatedUser);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
    };
  }
}
