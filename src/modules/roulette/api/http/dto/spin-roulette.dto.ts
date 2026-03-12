import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class SpinRouletteDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsInt()
  selectedNumber!: number;

  @IsInt()
  minRange!: number;

  @IsInt()
  maxRange!: number;

  @IsInt()
  @Min(1)
  betAmount!: number;

  @IsOptional()
  @IsInt()
  @Min(2)
  payoutMultiplier?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  gameDescription?: string;
}
