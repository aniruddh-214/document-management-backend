import { FindOptionsWhere } from 'typeorm';
import AppDataSource from '../../config/typeorm.config';
import { DocumentEntity } from '../../document/entities/document.entity';
import { IngestionEntity } from '../../ingestion/entities/ingestion.entity';
import UserEntity from '../../user/entities/user.entity';
import { TEST_DOCUMENT, TEST_USER } from './dummyData';

export default class TestFixtureHelper {
  public static userRepo = AppDataSource.getRepository(UserEntity);
  public static documentRepo = AppDataSource.getRepository(DocumentEntity);
  public static ingestionRepo = AppDataSource.getRepository(IngestionEntity);

  // ===== USER =====
  public static async insertUser(user: Partial<UserEntity> = TEST_USER) {
    const userData = this.userRepo.create(user);
    return await this.userRepo.save(userData);
  }

  public static async deleteUser(options: FindOptionsWhere<UserEntity>) {
    return await this.userRepo.delete(options);
  }

  public static async softDeleteUser(user: FindOptionsWhere<UserEntity>) {
    return await this.userRepo.softDelete(user);
  }

  public static async clearUserTable() {
    const tableName = this.userRepo.metadata.tableName;
    await AppDataSource.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
  }

  // ===== DOCUMENT =====
  public static async insertDocument(
    document: Partial<DocumentEntity> = TEST_DOCUMENT(),
  ) {
    const docData = this.documentRepo.create(document);
    return await this.documentRepo.save(docData);
  }

  public static async deleteDocument(
    options: FindOptionsWhere<DocumentEntity>,
  ) {
    return await this.documentRepo.delete(options);
  }

  public static async softDeleteDocument(
    options: FindOptionsWhere<DocumentEntity>,
  ) {
    return await this.documentRepo.softDelete(options);
  }

  public static async clearDocumentTable() {
    const tableName = this.documentRepo.metadata.tableName;
    await AppDataSource.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
  }

  // ===== INGESTION =====
  public static async insertIngestion(ingestion: Partial<IngestionEntity>) {
    const ingestionData = this.ingestionRepo.create(ingestion);
    return await this.ingestionRepo.save(ingestionData);
  }

  public static async deleteIngestion(
    options: FindOptionsWhere<IngestionEntity>,
  ) {
    return await this.ingestionRepo.delete(options);
  }

  public static async softDeleteIngestion(
    options: FindOptionsWhere<IngestionEntity>,
  ) {
    return await this.ingestionRepo.softDelete(options);
  }

  public static async clearIngestionTable() {
    const tableName = this.ingestionRepo.metadata.tableName;
    await AppDataSource.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
  }

  // ===== CLEAN ALL =====
  public static async deleteAllData() {
    await this.documentRepo.clear();
    await this.ingestionRepo.clear();
    await this.userRepo.clear();
  }
}
