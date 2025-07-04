import UserEntity from './user.entity';
import BcryptUtil from '../../common/utils/bcrypt.util';

jest.mock('../../common/utils/bcrypt.util');

describe('UserEntity Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should hash password before insert if not already hashed', () => {
    const user = new UserEntity();
    user.password = 'plainPassword';

    (BcryptUtil.hashPassword as jest.Mock).mockReturnValue(
      'hashedPasswordMock',
    );

    user.hashPassword();

    expect(BcryptUtil.hashPassword).toHaveBeenCalledWith('plainPassword');
    expect(user.password).toBe('hashedPasswordMock');
  });

  it('should not re-hash password if already hashed', () => {
    const user = new UserEntity();
    user.password = '$2b$10$someAlreadyHashedPassword';

    user.hashPassword();

    expect(BcryptUtil.hashPassword).not.toHaveBeenCalled();
    expect(user.password).toBe('$2b$10$someAlreadyHashedPassword');
  });

  it('should not hash if password is not set', () => {
    const user = new UserEntity();
    user.password = undefined as any;

    user.hashPassword();

    expect(BcryptUtil.hashPassword).not.toHaveBeenCalled();
  });
});
