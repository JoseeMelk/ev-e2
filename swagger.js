const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Administrador de Productos',
      version: '1.0.0',
      description: 'API REST para administración de productos - Evaluación Técnica VPS B',
    },
    servers: [
      { url: 'https://143.198.237.96', description: 'Servidor de producción' },
    ],
  },
  apis: ['./index.js'],
};

module.exports = swaggerJsdoc(options);
