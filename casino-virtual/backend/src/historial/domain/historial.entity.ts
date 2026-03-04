import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum CategoriaHistorial {
  JUEGO = 'Juego',
  DEPOSITO = 'Deposito',
  CONVERCION = 'Convercion',
}

@Entity('historial')
export class Historial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_usuario', type: 'varchar' })
  idUsuario: string;

  @Column({
    type: 'varchar',
    enum: CategoriaHistorial,
  })
  categoria: CategoriaHistorial;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'int', nullable: true })
  dinero?: number;

  @Column({ type: 'int', nullable: true })
  fichas?: number;

  @CreateDateColumn({ type: 'datetime' })
  fecha: Date;
}
