import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { limiter } from './middlewares/rateLimit.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { camelCaseMiddleware } from './middlewares/camelCase.js';
import authRoutes from './modules/auth/auth.routes.js';
import clienteRoutes from './modules/cliente/cliente.routes.js';
import valorHoraRoutes from './modules/valorHora/valorHora.routes.js';
import feriadoRoutes from './modules/feriado/feriado.routes.js';
import mesRoutes from './modules/mes/mes.routes.js';
import diaRoutes from './modules/dia/dia.routes.js';
import intervaloRoutes from './modules/intervalo/intervalo.routes.js';
import usuarioRoutes from './modules/usuario/usuario.routes.js';
import configuracaoRoutes from './modules/configuracao/configuracao.routes.js';
import syncRoutes from './modules/sync/sync.routes.js';
import swaggerUi from 'swagger-ui-express';
import { specs } from './docs/swagger.js';

const app = express();

// Security Middlewares
app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(limiter);

// Parse JSON
app.use(express.json());

// Transform Response to camelCase
app.use(camelCaseMiddleware);

// Swagger Documentation
const swaggerOptions = {
  customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
  ],
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cliente', clienteRoutes);
app.use('/api/valor-hora', valorHoraRoutes);
app.use('/api/feriado', feriadoRoutes);
app.use('/api/mes', mesRoutes);
app.use('/api/dia', diaRoutes);
app.use('/api/intervalo', intervaloRoutes);
app.use('/api/usuario', usuarioRoutes);
app.use('/api/configuracao', configuracaoRoutes);
app.use('/api/sync', syncRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Error Handling
app.use(errorHandler);

export default app;
