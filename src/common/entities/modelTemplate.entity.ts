import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

/**
 * The basic columns model template for all entities
 */
export default abstract class ModelTemplate {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at' })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  public updatedAt: Date;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  public isActive: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  public isDeleted: boolean;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  public deletedAt?: Date;
}
