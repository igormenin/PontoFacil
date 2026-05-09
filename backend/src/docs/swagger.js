import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ponto Fácil API',
      version: '1.0.0',
      description: 'Documentação da API do sistema Ponto Fácil, com suporte a camelCase e cálculos automáticos.',
    },
    servers: [
      {
        url: 'https://pontofacil-seven.vercel.app/api',
        description: 'Servidor de Produção (Vercel)',
      },
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor Local (Desenvolvimento)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.js'], // Scan routes for JSDoc
};

export const specs = swaggerJsdoc(options);
