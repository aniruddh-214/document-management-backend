import { Entity, Column, OneToMany, BeforeInsert, BeforeUpdate } from 'typeorm';

import ModelTemplate from '../../common/entities/modelTemplate.entity';
import UserRoleEnum from '../../common/enums/role.enum';
import BcryptUtil from '../../common/utils/bcrypt.util';
import { DocumentEntity } from '../../document/entities/document.entity';
import { IngestionEntity } from '../../ingestion/entities/ingestion.entity';

@Entity({ name: 'users' })
export default class UserEntity extends ModelTemplate {
  @Column({ name: 'full_name', type: 'varchar', length: 150, nullable: false })
  public fullName: string;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 150,
    unique: true,
    nullable: false,
  })
  public email: string;

  @Column({ name: 'password', type: 'text', nullable: false })
  public password: string;

  @Column({
    name: 'role',
    type: 'varchar',
    length: 50,
    default: UserRoleEnum.VIEWER,
  })
  public role: UserRoleEnum;

  @OneToMany(() => DocumentEntity, (document) => document.user)
  public documents: DocumentEntity[];

  @OneToMany(() => IngestionEntity, (ingestion) => ingestion.user)
  public ingestions: IngestionEntity[];

  @BeforeInsert()
  @BeforeUpdate()
  hashPassword(): void {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = BcryptUtil.hashPassword(this.password);
    }
  }
}
