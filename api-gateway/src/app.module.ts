import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtMiddleware } from './auth/jwt.middleware';
import { CircuitBreakerInterceptor } from './common/circuit-breaker.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        USER_SERVICE_URL: Joi.string().required(),
        ORDER_SERVICE_URL: Joi.string().required(),
        SAGA_SERVICE_URL: Joi.string().required(),
        AUTH_SERVICE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    AuthModule,
  ],
  controllers: [],
  providers: [
    JwtMiddleware,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: CircuitBreakerInterceptor },
  ],
})
export class AppModule {
}
