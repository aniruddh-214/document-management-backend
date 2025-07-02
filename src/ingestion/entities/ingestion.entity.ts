import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

import ModelTemplate from '../../common/entities/modelTemplate.entity';
import { DocumentEntity } from '../../document/entities/document.entity';
import UserEntity from '../../user/entities/user.entity';
import IngestionStatusEnum from '../enums/ingestion.enum';

@Entity('ingestions')
export class IngestionEntity extends ModelTemplate {
  @Column({
    type: 'varchar',
    length: 50,
    default: IngestionStatusEnum.QUEUED,
  })
  public status: IngestionStatusEnum;

  @Column({ type: 'text', nullable: true })
  public logs?: string;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  public errorMessage?: string;

  @Column({ type: 'timestamptz', name: 'finished_at', nullable: true })
  public finishedAt?: Date;

  @Column({ type: 'uuid', name: 'document_id', nullable: false })
  public documentId: string;

  @ManyToOne(() => DocumentEntity, (document) => document.ingestions, {
    nullable: false,
  })
  @JoinColumn({ name: 'document_id' })
  public document: DocumentEntity;

  @Column({ type: 'uuid', name: 'user_id', nullable: false })
  public userId: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  public user: UserEntity;
}
