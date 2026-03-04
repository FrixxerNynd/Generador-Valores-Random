import { Injectable, BadRequestException } from '@nestjs/common';
import type { IAuthRepository } from '../domain/auth.repository.interface';
import type { IPasswordHasher } from '../domain/password-hasher.interface';
import { User } from '../domain/user.entity';
import { v4 as uuid } from 'uuid';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(
    name: string,
    lastName: string,
    email: string,
    password: string,
  ): Promise<{ id: string; email: string; name: string }> {
    // Verificar si el email ya existe
    const existingUser = await this.authRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está registrado');
    }

    // Hashear la contraseña
    const passwordHash = await this.passwordHasher.hash(password);

    // Crear nuevo usuario con rol por defecto 'user'
    const userId = uuid();
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

    return {
      id: userId,
      email: newUser.email,
      name: newUser.name,
    };
  }
}
