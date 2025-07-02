import { MigrationInterface, QueryRunner } from 'typeorm';

export class Refactor1751386591824 implements MigrationInterface {
  name = 'Refactor1751386591824';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "ingestions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "status" character varying(50) NOT NULL DEFAULT 'queued', "logs" text, "error_message" text, "finished_at" TIMESTAMP WITH TIME ZONE, "document_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_71cd42dcb8c3b621cd1f7141b2d" PRIMARY KEY ("id"))`,
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
    await queryRunner.query(`DROP TABLE "ingestions"`);
  }
}
