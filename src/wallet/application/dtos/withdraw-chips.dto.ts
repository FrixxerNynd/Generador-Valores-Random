import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class WithdrawChipsDto {
  userId!: string;

  @IsNumber()
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  chipsAmount!: number; // Fichas a retirar (se convierten a MXN)
}
