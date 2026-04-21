import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { JwtMiddleware } from './auth/jwt.middleware';
import { attachUserHeaders } from './common/proxy-helpers';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const jwtMiddleware = app.get(JwtMiddleware);
  const jwt = jwtMiddleware.use.bind(jwtMiddleware); 

  app.use(
    jwt,
    createProxyMiddleware({
      pathFilter: '/users',
      target: process.env.USER_SERVICE_URL,
      changeOrigin: true,
    }),
  );
  app.use(
    jwt,
    createProxyMiddleware({
      target: process.env.SAGA_SERVICE_URL,
      changeOrigin: true,
      pathFilter: '/saga',
      on: { proxyReq: attachUserHeaders },
    }),
  );
  app.use(
    jwt,
    createProxyMiddleware({
      target: process.env.ORDER_SERVICE_URL,
      changeOrigin: true,
      pathFilter: '/orders',
      on: { proxyReq: attachUserHeaders },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
