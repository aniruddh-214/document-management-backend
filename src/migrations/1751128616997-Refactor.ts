import { MigrationInterface, QueryRunner } from 'typeorm';

export class Refactor1751128616997 implements MigrationInterface {
  name = 'Refactor1751128616997';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'editor', 'viewer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_active" boolean NOT NULL DEFAULT true, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "full_name" character varying(100) NOT NULL, "email" character varying(150) NOT NULL, "password" text NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'viewer', "last_login" TIMESTAMP, CONSTRAINT "idx_email" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cb12b0e7d1ffb15e3fe1edd5dd" ON "users" ("last_login") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cb12b0e7d1ffb15e3fe1edd5dd"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
