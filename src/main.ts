import { NestFactory } from '@nestjs/core';

import * as helmet from 'helmet';

import { AppModule } from './app.module';
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as serverless from 'serverless-http';

// const port = process.env.PORT || 4000;
const expressApp = express();
async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );
  await app.init();

  app.enableCors({
    origin: (req, callback) => callback(null, true),
  });
  app.use(helmet());

  await app.init();
}

bootstrap().then(() => {
  console.log('App is running on %s port');
});

const handler = serverless(expressApp);

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return await handler(event, context);
};
