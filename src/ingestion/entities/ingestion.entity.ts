import { Index, Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

import ModelTemplate from '../../common/entities/modelTemplate.entity';
import { DocumentEntity } from '../../document/entities/document.entity';
import UserEntity from '../../user/entities/user.entity';
import IngestionStatusEnum from '../enums/ingestion.enum';

@Index('idx_ingestion_document_id', ['documentId'])
@Index('idx_ingestion_status', ['status'])
@Index('idx_ingestion_triggered_by', ['userId'])
@Entity('ingestions')
export class IngestionEntity extends ModelTemplate {
  @Column({ type: 'uuid', name: 'document_id', nullable: false })
  documentId: string;

  @ManyToOne(() => DocumentEntity, (document) => document.ingestions, {
    nullable: false,
  })
  @JoinColumn({ name: 'document_id' })
  document: DocumentEntity;

  @Column({
    type: 'enum',
    enum: IngestionStatusEnum,
    default: IngestionStatusEnum.QUEUED,
  })
  status: IngestionStatusEnum;

  @Column({ type: 'uuid', name: 'user_id', nullable: false })
  userId: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'text', nullable: true })
  logs?: string;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage?: string;
}
