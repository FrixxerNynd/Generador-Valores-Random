import { IsString, IsNotEmpty, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreditWinnerDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsPositive()
  chipsAmount: number; // Fichas ganadas

  @IsString()
  @IsNotEmpty()
  gameDescription: string; // Ej: "Premio Tragamonedas: 3x Cereza"
}
