import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Historial } from '../domain/historial.entity';
import { GetHistoryFilterDto } from '../domain/dto/get-history-filter.dto';

@Injectable()
export class GetUserHistoryService {
  constructor(
    @InjectRepository(Historial)
    private readonly historialRepository: Repository<Historial>,
  ) {}

  async execute(userId: string, filters: Omit<GetHistoryFilterDto, 'Usuario'>): Promise<Historial[]> {
    const query = this.historialRepository.createQueryBuilder('historial');

    query.andWhere('historial.id_usuario = :usuario', { usuario: userId });

    if (filters.Categoria) {
      query.andWhere('historial.categoria = :categoria', { categoria: filters.Categoria });
    }

    if (filters.Fecha_inicial) {
      query.andWhere('historial.fecha >= :fechaInicial', { fechaInicial: filters.Fecha_inicial });
    }

    if (filters.Fecha_final) {
      query.andWhere('historial.fecha <= :fechaFinal', { fechaFinal: filters.Fecha_final });
    }

    query.orderBy('historial.fecha', 'DESC');

    return await query.getMany();
  }
}
