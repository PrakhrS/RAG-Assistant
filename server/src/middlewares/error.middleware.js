import ApiError from '../utils/ApiError.js';

// eslint-disable-next-line no-unused-vars -- Express requires all 4 params to identify error middleware
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        statusCode: err.statusCode,
        message: err.message,
      },
    });
  }

  console.error('Unexpected error:', err);

  return res.status(500).json({
    error: {
      statusCode: 500,
      message: 'Internal server error',
    },
  });
}

export default errorHandler;
