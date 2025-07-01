import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';

import ModelTemplate from '../../common/entities/modelTemplate.entity';
import UserEntity from '../../user/entities/user.entity';

@Index('idx_documents_user_id', ['userId'])
@Index('idx_documents_created_at', ['createdAt'])
@Entity('documents')
export class DocumentEntity extends ModelTemplate {
  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255, nullable: false })
  fileName: string;

  @Column({ name: 'file_path', type: 'varchar', length: 255, nullable: false })
  filePath: string;

  @Column({ name: 'mime_type', type: 'text', nullable: false })
  mimeType?: string;

  @Column({ type: 'int', nullable: false })
  size: number;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  public userId: string;

  @ManyToOne(() => UserEntity, (user) => user.documents, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  public user: UserEntity;
}
