export const AUTH_SWAGGER_SCHEMA = {
  REGISTER_USER: {
    summary: 'Register a new user',
    tags: ['Auth'],
    body: {
      type: 'object',
      properties: {
        fullName: { type: 'string', example: 'Aniruddh' },
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: '1Upper@specialChar' },
      },
      required: ['email', 'password', 'fullName'],
    },
    responses: [
      {
        status: 201,
        description: 'User successfully registered',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 201 },
            data: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '80966f24-e295-4e0e-b40f-2c08ee8eccc7',
                },
                role: { type: 'string', example: 'viewer' },
              },
              required: ['id', 'role'],
            },
            message: { type: 'string', example: 'Request successful' },
          },
          required: ['statusCode', 'data', 'message'],
        },
      },
      {
        status: 409,
        description: 'Conflict - Email already in use',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 409 },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-07-01T17:20:43.996Z',
            },
            path: { type: 'string', example: '/auth/register' },
            message: {
              type: 'object',
              properties: {
                message: { type: 'string', example: 'Email already in use' },
                error: { type: 'string', example: 'Conflict' },
                statusCode: { type: 'number', example: 409 },
              },
              required: ['message', 'error', 'statusCode'],
            },
          },
          required: ['statusCode', 'timestamp', 'path', 'message'],
        },
      },
    ],
  },
  LOGIN_USER: {
    summary: 'User login',
    tags: ['Auth'],
    body: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'StrongP@ssw0rd' },
      },
      required: ['email', 'password'],
    },
    responses: [
      {
        status: 200,
        description: 'Successful login',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 200 },
            data: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                  example:
                    'eyJhbGciOiJIUzUxiliowEf7QvqcSkLt-gqnHH6K4u-r0j1zPIqYQ',
                },
              },
              required: ['accessToken'],
            },
            message: { type: 'string', example: 'Request successful' },
          },
          required: ['statusCode', 'data', 'message'],
        },
      },
      {
        status: 404,
        description: 'User not found',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 404 },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-07-01T17:28:28.543Z',
            },
            path: { type: 'string', example: '/auth/login' },
            message: {
              type: 'object',
              properties: {
                message: { type: 'string', example: 'User not found' },
                error: { type: 'string', example: 'Not Found' },
                statusCode: { type: 'number', example: 404 },
              },
              required: ['message', 'error', 'statusCode'],
            },
          },
          required: ['statusCode', 'timestamp', 'path', 'message'],
        },
      },
      {
        status: 401,
        description: 'Incorrect password',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-07-01T17:30:00.000Z',
            },
            path: { type: 'string', example: '/auth/login' },
            message: {
              type: 'object',
              properties: {
                message: { type: 'string', example: 'Incorrect password' },
                error: { type: 'string', example: 'Unauthorized' },
                statusCode: { type: 'number', example: 401 },
              },
              required: ['message', 'error', 'statusCode'],
            },
          },
          required: ['statusCode', 'timestamp', 'path', 'message'],
        },
      },
    ],
  },
  LOGOUT_USER: {
    summary: 'User logout',
    description:
      'Logs out the current authenticated user. Requires a valid JWT token. Returns a success message upon logout.',
    tags: ['Auth'],
    auth: true,
    responses: [
      {
        status: 200,
        description: 'Successful logout',
        type: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Successfully logged out' },
          },
          required: ['message'],
        },
      },
      {
        status: 401,
        description: 'Authorization token not found or invalid',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            timestamp: { type: 'string', format: 'date-time' },
            path: { type: 'string', example: '/auth/logout' },
            message: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Authorization token not found',
                },
                error: { type: 'string', example: 'Unauthorized' },
                statusCode: { type: 'number', example: 401 },
              },
            },
          },
          required: ['statusCode', 'timestamp', 'path', 'message'],
        },
      },
    ],
  },
  USER_PROFILE: {
    summary: 'Get user profile',
    description:
      'Returns the profile details of the authenticated user based on the JWT token.',
    tags: ['Auth'],
    auth: true,
    responses: [
      {
        status: 200,
        description: 'User profile fetched successfully',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 200 },
            data: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '123e4567-e89b-12d3-a456-426614174000',
                },
                email: { type: 'string', example: 'user@example.com' },
                role: { type: 'string', example: 'viewer' },
              },
              required: ['id', 'email', 'role'],
            },
            message: { type: 'string', example: 'Request successful' },
          },
          required: ['statusCode', 'data', 'message'],
        },
      },
      {
        status: 401,
        description: 'Unauthorized – invalid or missing JWT token',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-07-01T17:40:52.923Z',
            },
            path: { type: 'string', example: '/auth/profile' },
            message: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Authorization token not found',
                },
                error: { type: 'string', example: 'Unauthorized' },
                statusCode: { type: 'number', example: 401 },
              },
              required: ['message', 'error', 'statusCode'],
            },
          },
          required: ['statusCode', 'timestamp', 'path', 'message'],
        },
      },
    ],
  },
};
