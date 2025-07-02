import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIndexesPostRefactoring1751385611832
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX idx_user_email_active ON users(email) WHERE deleted_at IS NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX idx_user_id_active ON users(id) WHERE deleted_at IS NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX idx_user_created_at_active ON users(created_at) WHERE deleted_at IS NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX idx_user_id_role_active ON users(id, role) WHERE deleted_at IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_id_role_active;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_created_at_active;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_id_active;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_email_active;`);
  }
}
