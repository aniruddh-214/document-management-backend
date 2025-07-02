import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
} from 'typeorm';

export default abstract class ModelTemplate {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @VersionColumn()
  public version: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  public createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  public updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  public deletedAt?: Date;
}
