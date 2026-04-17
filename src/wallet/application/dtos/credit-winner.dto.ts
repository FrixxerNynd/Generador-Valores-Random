import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreditWinnerDto {
  userId!: string;

  @IsNumber()
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  chipsAmount!: number; // Fichas ganadas

  @IsString()
  @IsNotEmpty()
  gameDescription!: string; // Ej: "Premio Tragamonedas: 3x Cereza"
}
