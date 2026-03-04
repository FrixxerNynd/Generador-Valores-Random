import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Historial, CategoriaHistorial } from '../domain/historial.entity';

export interface CreateHistoryDto {
  id_usuario: string;
  categoria: CategoriaHistorial;
  descripcion: string;
  dinero?: number;
  fichas?: number;
}

@Injectable()
export class AddHistoryService {
  constructor(
    @InjectRepository(Historial)
    private readonly historialRepository: Repository<Historial>,
  ) {}

  async execute(dto: CreateHistoryDto): Promise<Historial> {
    const newRecord = this.historialRepository.create({
      idUsuario: dto.id_usuario,
      categoria: dto.categoria,
      descripcion: dto.descripcion,
      dinero: dto.dinero,
      fichas: dto.fichas,
      // La base de datos asignará 'fecha' automáticamente usando @CreateDateColumn,
      // pero el PDF pide que el servidor se encargue de "Date.now()", así que
      // lo aseguramos aquí por si se requiere mayor precisión que el default del DB.
      fecha: new Date(),
    });

    return await this.historialRepository.save(newRecord);
  }
}
