import { z } from 'zod';

import ZodHelper from '../../../common/helpers/zod.helper';
import { USER_CONSTANTS } from '../../../user/constants/user.constant';

const { VALIDATION_MESSAGES } = USER_CONSTANTS.REQUEST;

export const AuthSchema = z.object({
  createUser: z.object({
    body: z.object({
      fullName: z
        .string()
        .min(3, { message: VALIDATION_MESSAGES.NAME_REQUIRED })
        .max(100, { message: VALIDATION_MESSAGES.NAME_TOO_LONG })
        .regex(USER_CONSTANTS.ZOD.USER_NAME_REGEX, {
          message:
            VALIDATION_MESSAGES.NAME_CAN_ONLY_CONTAIN_ALPHABETICAL_CHARACTERS,
        })
        .transform(ZodHelper.cleanName),
      email: z
        .string()
        .email({ message: VALIDATION_MESSAGES.INVALID_EMAIL })
        .transform((value) => value.toLowerCase().trim()),

      password: z
        .string()
        .min(8, { message: VALIDATION_MESSAGES.MIN_REQUIRED_CHAR })
        .max(30, { message: VALIDATION_MESSAGES.MAX_ALLOWED_CHAR })
        .regex(USER_CONSTANTS.ZOD.PASSWORD_REGEX, {
          message: VALIDATION_MESSAGES.PASSWORD_REGEX_ERROR,
        }),
    }),
  }),

  loginUser: z.object({
    body: z.object({
      email: z
        .string()
        .email({ message: VALIDATION_MESSAGES.INVALID_EMAIL })
        .transform((value) => value.toLowerCase().trim()),
      password: z.string(),
    }),
  }),
});

export type CreateUserRequestType = z.infer<
  typeof AuthSchema.shape.createUser.shape.body
>;

export type LoginUserRequestType = z.infer<
  typeof AuthSchema.shape.loginUser.shape.body
>;
