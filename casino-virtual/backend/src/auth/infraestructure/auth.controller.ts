import {
  Controller,
  Post,
  Body,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { LoginUseCase } from '../aplication/login.use-case';
import { RegisterUseCase } from '../aplication/register.use-case';
import { UpdateUserUseCase } from '../aplication/update-user.use-case';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user?: {
    sub: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.CREATED)
  async login(@Body() loginDto: LoginDto) {
    return await this.loginUseCase.execute(loginDto.email, loginDto.password);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return await this.registerUseCase.execute(
      registerDto.name,
      registerDto.lastName,
      registerDto.email,
      registerDto.password,
    );
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // El userId viene del token JWT validado
    const userId = req.user!.sub;
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    return await this.updateUserUseCase.execute(userId, updateUserDto);
  }
}
