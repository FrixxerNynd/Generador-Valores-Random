import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  Name!: string;

  @IsString({ message: 'El apellido debe ser un texto' })
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El apellido no puede exceder 50 caracteres' })
  Last_name!: string;

  @IsString({ message: 'El nickname debe ser un texto' })
  @MinLength(3, { message: 'El nickname debe tener al menos 3 caracteres' })
  @MaxLength(20, { message: 'El nickname no puede exceder 20 caracteres' })
  Nickname!: string;

  @IsDate({ message: 'La fecha de nacimiento debe ser una fecha válida' })
  @Type(() => Date)
  Born_Date!: Date;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  Email!: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(128, { message: 'La contraseña no puede exceder 128 caracteres' })
  Password!: string;
}
