import { Entity, Unique, Column, Index, OneToMany } from 'typeorm';

import ModelTemplate from '../../common/entities/modelTemplate.entity';
import UserRoleEnum from '../../common/enums/role.enum';
import { DocumentEntity } from '../../document/entities/document.entity';
import { IngestionEntity } from '../../ingestion/entities/ingestion.entity';

@Entity({ name: 'users' })
@Unique('idx_email', ['email'])
export default class UserEntity extends ModelTemplate {
  @Column({ name: 'full_name', type: 'varchar', length: 100, nullable: false })
  public fullName: string;

  @Column({ name: 'email', type: 'varchar', length: 150, nullable: false })
  public email: string;

  @Column({ name: 'password', type: 'text', nullable: false })
  public password: string;

  @Column({
    type: 'enum',
    enum: UserRoleEnum,
    default: UserRoleEnum.VIEWER,
  })
  public role: UserRoleEnum;

  @Index()
  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin?: Date;

  @OneToMany(() => DocumentEntity, (document) => document.user)
  public documents: DocumentEntity[];

  @OneToMany(() => IngestionEntity, (ingestion) => ingestion.user)
  public ingestions: IngestionEntity[];
}
