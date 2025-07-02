import { DataSource } from 'typeorm';

export async function runWeeder(dataSource: DataSource): Promise<void> {
  console.time('Weeder cleanup');
  await dataSource.query(
    `TRUNCATE TABLE ingestions, documents, users RESTART IDENTITY CASCADE;`,
  );
  console.timeEnd('Weeder cleanup');
}
