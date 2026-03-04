import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { IAuthRepository } from '../domain/auth.repository.interface';
import type { IPasswordHasher } from '../domain/password-hasher.interface';
import { JwtAdapter } from '../../auth/infraestructure/adapters/jwt.adapter';

@Injectable()
export class LoginUseCase {
  constructor(private readonly authRepository: IAuthRepository, 
    private readonly jwtAdapter: JwtAdapter,
    private readonly passwordHasher: IPasswordHasher) {}

    async execute(email: string, pass: string) {
    const user = await this.authRepository.findByEmail(email);

   if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas o cuenta inactiva');
    }

    const isPasswordValid = await this.passwordHasher.compare(pass, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    const payload = { sub: user.id, email: user.email, roles: user.roles };
    return {
      access_token: this.jwtAdapter.generateToken(payload),
    };
  }
}