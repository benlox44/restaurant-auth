import { join } from 'path';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

import { AppModule } from './app.module.js';
import 'dotenv/config';

const logger = new Logger('Bootstrap');

async function bootstrap(): Promise<void> {
  const grpcPort = process.env.GRPC_PORT || '50051';
  
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: ['auth', 'users'],
      protoPath: [
        join(process.cwd(), 'proto/auth.proto'),
        join(process.cwd(), 'proto/users.proto'),
      ],
      url: `0.0.0.0:${grpcPort}`,
    },
  });

  await app.listen();
  logger.log(`🔌 gRPC Server is running on port ${grpcPort}`);
}

bootstrap().catch(err => {
  logger.error('❌ Error during app bootstrap', err);
  process.exit(1);
});
