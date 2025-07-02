import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDocumentIndexPostRefactoring1751385963523
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_id_active ON documents(id) WHERE deleted_at IS NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_user_id_created_at_active ON documents(user_id, created_at) WHERE deleted_at IS NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_documents_id_active;`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_documents_user_id_created_at_active;`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_documents_created_at;`);
  }
}
