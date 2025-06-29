import UserEntity from '../../entities/user.entity';

export type GetUserByIdResponseType = Omit<UserEntity, 'id' | 'password'>;
