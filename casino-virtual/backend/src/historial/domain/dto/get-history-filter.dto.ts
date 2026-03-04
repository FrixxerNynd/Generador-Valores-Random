import { IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';
import { CategoriaHistorial } from '../historial.entity';

export class GetHistoryFilterDto {
  @IsOptional()
  @IsDateString()
  Fecha_inicial?: string;

  @IsOptional()
  @IsDateString()
  Fecha_final?: string;

  @IsOptional()
  @IsEnum(CategoriaHistorial)
  Categoria?: CategoriaHistorial;

  @IsOptional()
  @IsString()
  Usuario?: string;
}
