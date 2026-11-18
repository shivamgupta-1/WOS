import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import applicationRouter from './routes/application.ts';
import domainRouter from './routes/domain.ts';
import awsRouter from './modules/aws/aws.routes.ts';
import swaggerDocument from './config/swagger.ts';
import prisma from './lib/prisma.ts';
import { startHealthCheckScheduler } from "./jobs/healthCheckScheduler.ts";


dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/api/openapi.json", (_req, res) => {
  res.status(200).json(swaggerDocument);
});
app.use(helmet());
app.use(morgan('combined'));


app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use('/api/applications', applicationRouter);
app.use("/api/domains", domainRouter);
app.use("/api/aws", awsRouter);
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log(err);
    res.status(500).json( {error: err})
});

const PORT = process.env.PORT;
void prisma.$connect()
  .then(() => {
    console.log('Connected to the database');
    startHealthCheckScheduler();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error: unknown) => {
    console.error('Unable to connect to the database:', error);
    process.exitCode = 1;
  });