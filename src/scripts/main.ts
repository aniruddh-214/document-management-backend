import AppDataSource from '../config/typeorm.config';
import { runSeeder } from './seeder.script';
import { runWeeder } from './weeder.script';

async function main() {
  await AppDataSource.initialize();
  await runWeeder(AppDataSource);
  await runSeeder(AppDataSource);
  await AppDataSource.destroy();
}

main().catch(console.error);
