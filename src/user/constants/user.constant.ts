// user.constants.ts

import UserRoleEnum from '../../common/enums/role.enum';

export const validRoles = Object.values(UserRoleEnum).filter(
  (r) => r !== UserRoleEnum.ADMIN,
);

export const USER_CONSTANTS = {
  ZOD: {
    USER_NAME_REGEX: /^[A-Za-z\s]+$/,

    PASSWORD_REGEX:
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/,
  },
  REQUEST: {
    VALIDATION_MESSAGES: {
      INVALID_USER_ID: 'Invalid User ID',
      NAME_REQUIRED: 'Full name must be valid',
      NAME_TOO_LONG: 'Full name must not exceed 100 characters',
      NAME_CAN_ONLY_CONTAIN_ALPHABETICAL_CHARACTERS:
        'Name can only contain alphabetical characters.',

      EMAIL_REQUIRED: 'Email must have at least 1 character',
      EMAIL_TOO_LONG: 'Email must not exceed 100 characters',
      INVALID_EMAIL:
        'This email is not acceptable. Please use a valid email address.',
      INVALID_INPUT: 'Invalid input',

      MIN_ONE_CHAR: 'Minimum 1 characters required',
      MIN_REQUIRED_CHAR: 'Minimum 8 characters required',
      MAX_ALLOWED_CHAR: 'Maximum 30 characters allowed',
      PASSWORD_REGEX_ERROR:
        'Password must contain at least one uppercase letter, one number, and one special character',

      ROLES_INVALID: `Roles must be a comma-separated list of: ${validRoles.join(', ')}`,
      INVALID_ROLE: `Roles must any from list of: ${validRoles.join(', ')}`,
      ROLE_MAX_LENGTH: 'Maximum of 2 roles are allowed',
      ROLE_DUPLICATE: 'Roles must be unique',

      DATE_REQUIRED: (field: string): string =>
        `${field} start date is required if end date is provided`,
      DATE_INVALID: (field: string): string =>
        `${field} must be a valid ISO or UTC date`,

      BOOLEAN_INVALID: (field: string): string =>
        `${field} must be either "true" or "false"`,

      PAGE_INVALID: 'Page must be >= 1 and less than MAX_SAFE_INTEGER',
      LIMIT_INVALID: 'Limit must be between 1 and 100',

      SORT_ORDER_INVALID: 'Sort order must be either "ASC" or "DESC"',

      SELECT_INVALID: 'Invalid Input',
    },
    ALLOWED_FIELDS: [
      'id',
      'full_name',
      'email',
      'role',
      'created_at',
      'updated_at',
      'last_login',
      'is_active',
      'is_deleted',
    ],
    VALID_ROLES: validRoles,
  },
};
