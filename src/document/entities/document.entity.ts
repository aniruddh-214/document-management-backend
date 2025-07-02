import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

import ModelTemplate from '../../common/entities/modelTemplate.entity';
import { IngestionEntity } from '../../ingestion/entities/ingestion.entity';
import UserEntity from '../../user/entities/user.entity';

@Entity('documents')
export class DocumentEntity extends ModelTemplate {
  @Column({ type: 'varchar', length: 255, nullable: false })
  public title: string;

  @Column({ type: 'text', nullable: true })
  public description?: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255, nullable: false })
  public fileName: string;

  @Column({ name: 'file_path', type: 'varchar', length: 255, nullable: false })
  public filePath: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 255, nullable: false })
  public mimeType: string;

  @Column({ type: 'int', nullable: false })
  public size: number;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  public userId: string;

  @ManyToOne(() => UserEntity, (user) => user.documents, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  public user: UserEntity;

  @OneToMany(() => IngestionEntity, (ingestion) => ingestion.document)
  public ingestions: IngestionEntity[];
}
