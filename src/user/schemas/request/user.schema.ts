import { z } from 'zod';

import { DatabaseSortingOrder } from '../../../common/enums/dbOrderSort.enum';
import UserRoleEnum from '../../../common/enums/role.enum';
import ZodHelper from '../../../common/helpers/zod.helper';
import { USER_CONSTANTS, userEntityKeys } from '../../constants/user.constant';
import UserEntity from '../../entities/user.entity';

const { VALIDATION_MESSAGES } = USER_CONSTANTS.REQUEST;

export const UsersSchema = z.object({
  getAllUsers: z.object({
    query: z.object({
      fullName: z
        .string()
        .trim()
        .min(1, { message: VALIDATION_MESSAGES.NAME_REQUIRED })
        .max(50, { message: VALIDATION_MESSAGES.NAME_TOO_LONG })
        .optional(),

      email: z
        .string()
        .trim()
        .min(1, { message: VALIDATION_MESSAGES.EMAIL_REQUIRED })
        .max(100, { message: VALIDATION_MESSAGES.EMAIL_TOO_LONG })
        .optional(),

      role: z
        .string()
        .trim()
        .min(1, { message: VALIDATION_MESSAGES.MIN_ONE_CHAR })
        .optional()
        .transform((val) =>
          val
            ? (Array.from(
                new Set(
                  val
                    .split(',')
                    .map((r) => r.trim().toLowerCase())
                    .filter((r) => r),
                ),
              ) as any[])
            : undefined,
        )
        .refine(
          (roles) =>
            !roles?.length ||
            (roles.every((r: any) =>
              Object.values(UserRoleEnum)
                .filter((role) => role !== UserRoleEnum.ADMIN)
                .includes(r),
            ) &&
              roles.length <= 2),
          { message: VALIDATION_MESSAGES.ROLES_INVALID },
        ),

      isActive: z
        .string()
        .min(1, { message: VALIDATION_MESSAGES.INVALID_INPUT })
        .transform((data): boolean | undefined =>
          ZodHelper.convertStringToBoolean(data),
        )
        .optional(),

      isDeleted: z
        .string()
        .min(1, { message: VALIDATION_MESSAGES.INVALID_INPUT })
        .transform((data): boolean | undefined =>
          ZodHelper.convertStringToBoolean(data),
        )
        .optional(),

      page: z
        .string()
        .min(1, { message: VALIDATION_MESSAGES.INVALID_INPUT })
        .optional()
        .transform((val) => Number(val || 1))
        .refine(
          (val) =>
            typeof val === 'number' &&
            val >= 1 &&
            val <= Number.MAX_SAFE_INTEGER,
          {
            message: VALIDATION_MESSAGES.PAGE_INVALID,
          },
        ),

      limit: z
        .string()
        .min(1, { message: VALIDATION_MESSAGES.INVALID_INPUT })
        .optional()
        .transform((val) => Number(val || 20))
        .refine((val) => val >= 1 && val <= 100, {
          message: VALIDATION_MESSAGES.LIMIT_INVALID,
        }),

      sortOrder: z
        .nativeEnum(DatabaseSortingOrder, {
          errorMap: () => ({
            message: VALIDATION_MESSAGES.SORT_ORDER_INVALID,
          }),
        })
        .optional()
        .default(DatabaseSortingOrder.DESC),

      select: z
        .string()
        .optional()
        .transform((val) =>
          val ? val.split(',').map((v) => v.trim()) : undefined,
        )
        .refine(
          (fields): fields is Array<keyof UserEntity> =>
            !fields ||
            fields.every((f) => userEntityKeys.includes(f as keyof UserEntity)),
          {
            message: VALIDATION_MESSAGES.SELECT_INVALID,
          },
        ),
    }),
  }),

  getUser: z.object({
    param: z.object({
      id: z.string().uuid({ message: VALIDATION_MESSAGES.INVALID_USER_ID }),
    }),
  }),

  updateUserDetails: z.object({
    param: z.object({
      id: z.string().uuid({ message: VALIDATION_MESSAGES.INVALID_USER_ID }),
    }),
    body: z.object({
      role: z
        .nativeEnum(
          Object.values(UserRoleEnum).filter(
            (role) => role !== UserRoleEnum.ADMIN,
          ) as any,
        )
        .refine(
          (val) =>
            val !== UserRoleEnum.ADMIN ||
            !Object.values(UserRoleEnum).includes(val),
          {
            message: VALIDATION_MESSAGES.INVALID_ROLE,
          },
        )
        .transform((val) => val as UserRoleEnum),
    }),
  }),

  deleteUser: z.object({
    param: z.object({
      id: z.string().uuid({ message: VALIDATION_MESSAGES.INVALID_USER_ID }),
    }),
  }),

  getUserDocuments: z.object({
    param: z.object({
      id: z.string().uuid({ message: VALIDATION_MESSAGES.INVALID_USER_ID }),
    }),
  }),
});

export type GetAllUSersRequestQueryType = z.infer<
  typeof UsersSchema.shape.getAllUsers.shape.query
>;

export type GetUserRequestParamType = z.infer<
  typeof UsersSchema.shape.getUser.shape.param
>;

export type UpdateUserDetailsRequestParamsType = z.infer<
  typeof UsersSchema.shape.updateUserDetails.shape.param
>;
export type UpdateUserDetailsRequestBodyType = z.infer<
  typeof UsersSchema.shape.updateUserDetails.shape.body
>;

export type DeleteUserRequestParamType = z.infer<
  typeof UsersSchema.shape.deleteUser.shape.param
>;

export type getUserDocumentsRequestParamType = z.infer<
  typeof UsersSchema.shape.getUserDocuments.shape.param
>;
