import GetAllUsersDto from './getAllUsers.dto';
import { DatabaseSortingOrder } from '../../common/enums/dbOrderSort.enum';
import { validRoles } from '../constants/user.constant';

describe('GetAllUsersDto', () => {
  it('should set default values when no input is provided', () => {
    const dto = new GetAllUsersDto({} as any);

    expect(dto.select).toEqual(['id', 'fullName', 'email', 'role']);
    expect(dto.fullName).toBeUndefined();
    expect(dto.email).toBeUndefined();
    expect(dto.role).toBeUndefined();
    expect(dto.isDeleted).toBeUndefined();
    expect(dto.sortOrder).toBeUndefined();
  });

  it('should set provided values correctly', () => {
    const query = {
      select: ['id', 'email'],
      fullName: 'John Doe',
      email: 'john@example.com',
      role: ['ADMIN', 'USER'],
      isDeleted: true,
      page: 3,
      limit: 50,
      sortOrder: DatabaseSortingOrder.ASC,
    };

    const dto = new GetAllUsersDto(query as any);

    expect(dto.select).toEqual(['id', 'email']);
    expect(dto.fullName).toBe('John Doe');
    expect(dto.email).toBe('john@example.com');
    expect(dto.role).toEqual(['ADMIN', 'USER']);
    expect(dto.isDeleted).toBe(true);
    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(50);
    expect(dto.sortOrder).toBe(DatabaseSortingOrder.ASC);
  });

  it('should cast role properly as validRoles[] type', () => {
    const query = {
      role: ['USER'],
    };

    const dto = new GetAllUsersDto(query as any);
    expect(dto.role).toEqual(['USER']);
  });

  it('should fallback to default select if not provided', () => {
    const query = {
      email: 'test@example.com',
    };

    const dto = new GetAllUsersDto(query as any);
    expect(dto.select).toEqual(['id', 'fullName', 'email', 'role']);
    expect(dto.email).toBe('test@example.com');
  });

  it('should ignore invalid select input (e.g., empty array)', () => {
    const dto = new GetAllUsersDto({ select: [] } as any);

    expect(dto.select).toEqual(['id', 'fullName', 'email', 'role']);
  });
});
