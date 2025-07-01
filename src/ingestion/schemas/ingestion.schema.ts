import { z } from 'zod';

import { DatabaseSortingOrder } from '../../common/enums/dbOrderSort.enum';
import ZodHelper from '../../common/helpers/zod.helper';
import { USER_CONSTANTS } from '../../user/constants/user.constant';
import {
  INGESTION_CONSTANTS,
  ingestionEntityKeys,
} from '../constants/ingestion.constant';
import { IngestionEntity } from '../entities/ingestion.entity';
import IngestionStatusEnum from '../enums/ingestion.enum';

export const IngestionSchema = z.object({
  triggerIngestion: z.object({
    param: z.object({
      id: z.string().uuid({ message: 'Invalid Document ID' }),
    }),
  }),

  getIngestionDetails: z.object({
    param: z.object({
      id: z.string().uuid({ message: 'Invalid Ingestion ID' }),
    }),
  }),

  deleteIngestion: z.object({
    param: z.object({
      id: z.string().uuid({ message: 'Invalid Ingestion ID' }),
    }),
  }),

  getAllIngestions: z.object({
    query: z.object({
      id: z
        .string()
        .uuid({ message: INGESTION_CONSTANTS.ZOD.INVALID_INGESTION_ID })
        .optional(),
      documentId: z
        .string()
        .uuid({ message: INGESTION_CONSTANTS.ZOD.INVALID_DOCUMENT_ID })
        .optional(),

      userId: z
        .string()
        .uuid({ message: INGESTION_CONSTANTS.ZOD.INVALID_USER_ID })
        .optional(),

      status: z
        .string()
        .optional()
        .transform((val) =>
          val ? val.split(',').map((s) => s.trim()) : undefined,
        )
        .refine(
          (statuses): statuses is IngestionStatusEnum[] =>
            !statuses ||
            statuses.every((s) =>
              Object.values(IngestionStatusEnum).includes(
                s as IngestionStatusEnum,
              ),
            ),
          {
            message: INGESTION_CONSTANTS.ZOD.INVALID_STATUS,
          },
        ),

      hasLogs: z
        .string()
        .min(1, { message: INGESTION_CONSTANTS.ZOD.INVALID_INPUT })
        .transform(ZodHelper.convertStringToBoolean)
        .optional(),

      hasError: z
        .string()
        .min(1, { message: INGESTION_CONSTANTS.ZOD.INVALID_INPUT })
        .transform(ZodHelper.convertStringToBoolean)
        .optional(),

      isActive: z
        .string()
        .min(1, { message: INGESTION_CONSTANTS.ZOD.INVALID_INPUT })
        .transform(ZodHelper.convertStringToBoolean)
        .optional(),

      isDeleted: z
        .string()
        .min(1, { message: INGESTION_CONSTANTS.ZOD.INVALID_INPUT })
        .transform(ZodHelper.convertStringToBoolean)
        .optional(),

      page: z
        .string()
        .min(1, { message: INGESTION_CONSTANTS.ZOD.INVALID_INPUT })
        .optional()
        .transform((val) => Number(val || 1))
        .refine((val) => val >= 1 && val <= Number.MAX_SAFE_INTEGER, {
          message: USER_CONSTANTS.REQUEST.VALIDATION_MESSAGES.PAGE_INVALID,
        }),

      limit: z
        .string()
        .min(1, {
          message: USER_CONSTANTS.REQUEST.VALIDATION_MESSAGES.INVALID_INPUT,
        })
        .optional()
        .transform((val) => Number(val || 20))
        .refine((val) => val >= 1 && val <= 100, {
          message: USER_CONSTANTS.REQUEST.VALIDATION_MESSAGES.LIMIT_INVALID,
        }),

      sortOrder: z
        .nativeEnum(DatabaseSortingOrder, {
          errorMap: () => ({
            message:
              USER_CONSTANTS.REQUEST.VALIDATION_MESSAGES.SORT_ORDER_INVALID,
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
          (fields): fields is Array<keyof IngestionEntity> =>
            !fields ||
            fields.every((f) =>
              ingestionEntityKeys.includes(f as keyof IngestionEntity),
            ),
          {
            message: INGESTION_CONSTANTS.ZOD.INVALID_INPUT,
          },
        ),
    }),
  }),
});

export type TriggerIngestionRequestParamType = z.infer<
  typeof IngestionSchema.shape.triggerIngestion.shape.param
>;

export type GetIngestionDetailsRequestParamType = z.infer<
  typeof IngestionSchema.shape.getIngestionDetails.shape.param
>;

export type DeleteIngestionRequestParamType = z.infer<
  typeof IngestionSchema.shape.deleteIngestion.shape.param
>;

export type GetAllIngestionsRequestQueryType = z.infer<
  typeof IngestionSchema.shape.getAllIngestions.shape.query
>;
