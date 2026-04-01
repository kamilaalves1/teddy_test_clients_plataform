import 'dotenv/config';
import path from 'path';
import { DataSource } from 'typeorm';

const isCompiled = __filename.endsWith('.js');

const entitiesPattern = path.resolve(__dirname, `../src/**/*.entity.${isCompiled ? 'js' : 'ts'}`);

const migrationsPattern = isCompiled
  ? path.resolve(__dirname, '*.js')
  : path.resolve(__dirname, '*.ts');

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'teddy_db',
  entities: [entitiesPattern],
  migrations: [migrationsPattern],
  synchronize: false,
});
