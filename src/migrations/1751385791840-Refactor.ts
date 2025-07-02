import { MigrationInterface, QueryRunner } from 'typeorm';

export class Refactor1751385791840 implements MigrationInterface {
  name = 'Refactor1751385791840';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "title" character varying(255) NOT NULL, "description" text, "file_name" character varying(255) NOT NULL, "file_path" character varying(255) NOT NULL, "mime_type" character varying(255) NOT NULL, "size" integer NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_c7481daf5059307842edef74d73" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_c7481daf5059307842edef74d73"`,
    );
    await queryRunner.query(`DROP TABLE "documents"`);
  }
}
