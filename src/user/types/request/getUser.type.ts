import UserEntity from '../../entities/user.entity';

export const userEntityKeys: Array<keyof UserEntity> = [
  'id',
  'email',
  'fullName',
  'role',
  'createdAt',
  'updatedAt',
  'isActive',
  'isDeleted',
  'lastLogin',
];
