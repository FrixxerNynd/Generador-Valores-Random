import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateWalletDto {
  @IsString({ message: 'El userId debe ser texto' })
  @IsNotEmpty({ message: 'El userId es obligatorio' })
  @IsUUID('4', { message: 'El userId debe ser un UUID v4 válido' })
  userId!: string;
}
