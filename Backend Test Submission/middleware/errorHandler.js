const { Logger } = require('../../Logging Middleware/logger');

// Simple error handler
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err.message);
  Logger.error('error-handler', `Error: ${err.message}`);
  
  // Simple error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong on our end'
  });
};

module.exports = { errorHandler };
