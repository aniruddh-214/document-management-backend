export const INGESTION_SWAGGER_SCHEMA = {
  TRIGGER_INGESTION: {
    summary: 'Trigger ingestion for a document',
    description:
      'Allows **ADMIN** and **EDITOR** roles to trigger ingestion for a specific document.\n\n' +
      '🧠 Ingestion queues the document for processing and extraction.\n\n' +
      '🔒 Requires authentication and appropriate role access.',
    tags: ['Ingestion'],
    auth: true,
    roles: ['admin', 'editor'],

    params: {
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'Document ID for which ingestion is to be triggered',
          example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // placeholder style
        },
      },
    },

    responses: [
      {
        status: 201,
        description: 'Ingestion triggered successfully',
        type: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example:
                    'Triggered ingestion successfully. Current status: queued',
                },
                documentId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                },
                ingestionId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                },
              },
            },
            message: {
              type: 'string',
              example: 'Request successful',
            },
          },
        },
      },
      {
        status: 404,
        description: 'Document not found',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 404 },
            message: {
              type: 'string',
              example: 'Document not found',
            },
            error: { type: 'string', example: 'Not Found' },
          },
        },
      },
      {
        status: 401,
        description: 'Unauthorized - Token is missing, expired, or invalid',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            message: {
              type: 'string',
              example: 'Invalid or expired token',
            },
            error: { type: 'string', example: 'Unauthorized' },
          },
        },
      },
      {
        status: 403,
        description: 'Forbidden - User lacks permission',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 403 },
            message: {
              type: 'string',
              example: 'You do not have permission to perform this action',
            },
            error: { type: 'string', example: 'Forbidden' },
          },
        },
      },
    ],
  },
  GET_INGESTION_DETAILS_BY_ID: {
    summary: 'Get ingestion details by ID',
    description:
      'Fetch detailed information about a specific ingestion process.\n\n' +
      '🔒 Requires valid JWT authentication.',
    tags: ['Ingestion'],
    auth: true,

    params: {
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'Unique ID of the ingestion job',
          example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // placeholder
        },
      },
    },

    responses: [
      {
        status: 200,
        description: 'Ingestion details fetched successfully',
        type: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                  example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-07-02T06:13:51.491Z',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-07-02T06:13:56.689Z',
                },
                status: {
                  type: 'string',
                  example: 'completed',
                  description: 'Current status of the ingestion job',
                },
                logs: {
                  type: 'string',
                  example: 'Completed successfully at 2025-07-02T06:13:56.678Z',
                },
                errorMessage: {
                  type: ['string', 'null'],
                  example: null,
                },
                documentId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                },
                userId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                },
              },
            },
            message: {
              type: 'string',
              example: 'Request successful',
            },
          },
        },
      },
      {
        status: 404,
        description: 'Ingestion not found',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 404 },
            message: {
              type: 'string',
              example:
                'Ingestion not found with ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
            },
            error: { type: 'string', example: 'Not Found' },
          },
        },
      },
      {
        status: 401,
        description: 'Unauthorized – Invalid or expired token',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            message: {
              type: 'string',
              example: 'Invalid or expired token',
            },
            error: { type: 'string', example: 'Unauthorized' },
          },
        },
      },
    ],
  },
  DELETE_INGESTION_BY_ID: {
    summary: 'Delete ingestion by ID',
    description:
      'Allows **ADMIN** users to permanently delete a specific ingestion.\n\n' +
      '🔒 Requires valid JWT and admin privileges.',
    tags: ['Ingestion'],
    auth: true,
    roles: ['admin'],

    params: {
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'ID of the ingestion to delete',
          example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // placeholder
        },
      },
    },

    responses: [
      {
        status: 200,
        description: 'Ingestion deleted successfully',
        type: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example:
                    'Ingestion with id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx has been deleted successfully',
                },
              },
            },
            message: {
              type: 'string',
              example: 'Request successful',
            },
          },
        },
      },
      {
        status: 404,
        description: 'Ingestion not found or already deleted',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 404 },
            message: {
              type: 'string',
              example:
                'Ingestion with ID xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx not found or already deleted',
            },
            error: { type: 'string', example: 'Not Found' },
          },
        },
      },
      {
        status: 403,
        description: 'Forbidden – User lacks necessary permissions',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 403 },
            message: {
              type: 'string',
              example: 'You do not have permission',
            },
            error: { type: 'string', example: 'Forbidden' },
          },
        },
      },
      {
        status: 401,
        description: 'Unauthorized – Missing or invalid token',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            message: {
              type: 'string',
              example: 'Invalid or expired token',
            },
            error: { type: 'string', example: 'Unauthorized' },
          },
        },
      },
    ],
  },
  GET_ALL_DOCUMENTS: {
    summary: 'Get all ingestions',
    description:
      'Fetches a paginated list of ingestions. Supports filters like documentId, userId, status, error presence, and logs.\n\n' +
      '🔒 Requires a valid JWT token.',
    tags: ['Ingestion'],
    auth: true,

    query: {
      required: [],
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'Filter by ingestion ID',
          example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        },
        documentId: {
          type: 'string',
          format: 'uuid',
          description: 'Filter by document ID',
          example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        },
        userId: {
          type: 'string',
          format: 'uuid',
          description: 'Filter by user ID',
          example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        },
        status: {
          type: 'string',
          description:
            'Comma-separated ingestion status values (e.g. "queued,processing,completed")',
          example: 'completed,queued',
        },
        hasLogs: {
          type: 'boolean',
          description: 'Filter ingestions with logs',
          example: true,
        },
        hasError: {
          type: 'boolean',
          description: 'Filter ingestions that have errors',
          example: false,
        },
        isDeleted: {
          type: 'boolean',
          description: 'Include soft-deleted ingestions',
          example: false,
        },
        page: {
          type: 'integer',
          minimum: 1,
          description: 'Pagination page (default: 1)',
          example: 1,
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          description: 'Number of items per page (default: 20)',
          example: 10,
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order (default: desc)',
          example: 'desc',
        },
        select: {
          type: 'string',
          description:
            'Comma-separated fields to include in result (e.g. "id,status,documentId")',
          example: 'id,status,documentId',
        },
      },
    },

    responses: [
      {
        status: 200,
        description: 'Successfully retrieved ingestions',
        type: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                      status: { type: 'string' },
                      logs: { type: 'string', nullable: true },
                      errorMessage: { type: 'string', nullable: true },
                      documentId: { type: 'string', format: 'uuid' },
                      userId: { type: 'string', format: 'uuid' },
                    },
                  },
                },
                totalCount: { type: 'number', example: 2 },
                totalPages: { type: 'number', example: 1 },
              },
            },
            message: {
              type: 'string',
              example: 'Request successful',
            },
          },
        },
      },
      {
        status: 401,
        description: 'Unauthorized – Invalid or expired token',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            message: {
              type: 'string',
              example: 'Invalid or expired token',
            },
            error: { type: 'string', example: 'Unauthorized' },
          },
        },
      },
    ],
  },
};
