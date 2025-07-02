import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIngestionIndexesPostRefactoring1751386660788
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_ingestions_id_active ON ingestions(id) WHERE deleted_at IS NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_ingestions_user_id_active ON ingestions(user_id) WHERE deleted_at IS NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_ingestions_document_id_active ON ingestions(document_id) WHERE deleted_at IS NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_ingestions_created_at ON ingestions(created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_ingestions_id_active;`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_ingestions_user_id_active;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_ingestions_document_id_active;`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_ingestions_created_at;`);
  }
}
