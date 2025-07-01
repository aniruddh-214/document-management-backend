import { MigrationInterface, QueryRunner } from 'typeorm';

export class Refactor1751351445958 implements MigrationInterface {
  name = 'Refactor1751351445958';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."ingestions_status_enum" AS ENUM('queued', 'processing', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ingestions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_active" boolean NOT NULL DEFAULT true, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "document_id" uuid NOT NULL, "status" "public"."ingestions_status_enum" NOT NULL DEFAULT 'queued', "user_id" uuid NOT NULL, "logs" text, "error_message" text, CONSTRAINT "PK_71cd42dcb8c3b621cd1f7141b2d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ingestion_triggered_by" ON "ingestions" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ingestion_status" ON "ingestions" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ingestion_document_id" ON "ingestions" ("document_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "ingestions" ADD CONSTRAINT "FK_88707deb73f776708ddc77db437" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingestions" ADD CONSTRAINT "FK_700305e0a115675c6e7082ab498" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ingestions" DROP CONSTRAINT "FK_700305e0a115675c6e7082ab498"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingestions" DROP CONSTRAINT "FK_88707deb73f776708ddc77db437"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_ingestion_document_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_ingestion_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_ingestion_triggered_by"`);
    await queryRunner.query(`DROP TABLE "ingestions"`);
    await queryRunner.query(`DROP TYPE "public"."ingestions_status_enum"`);
  }
}
