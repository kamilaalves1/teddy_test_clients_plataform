import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Teddy Client Manager API')
    .setDescription(
      'API do desafio Teddy Client Manager. A documentação cobre autenticação, gestão de clientes e os endpoints auxiliares de healthcheck e métricas usados no fluxo atual do projeto.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}
