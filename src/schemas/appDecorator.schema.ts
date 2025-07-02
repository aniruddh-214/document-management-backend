export const APP_CONTROLLER_SCHEMA = {
  hello: {
    summary: 'Get Hello message',
    tags: ['App'],
    responses: [
      {
        status: 200,
        message: 'Hello World',
        description: 'Successful response',
        type: String,
      },
    ],
  },
};
