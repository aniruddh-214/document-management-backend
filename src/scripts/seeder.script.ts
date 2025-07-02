import { DataSource } from 'typeorm';
import UserRoleEnum from '../common/enums/role.enum';
import BcryptUtil from '../common/utils/bcrypt.util';
import { DocumentEntity } from '../document/entities/document.entity';
import { IngestionEntity } from '../ingestion/entities/ingestion.entity';
import IngestionStatusEnum from '../ingestion/enums/ingestion.enum';
import UserEntity from '../user/entities/user.entity';

export const USER_COUNT = 1001;
export const DOCUMENT_COUNT = 100000;
export const INGESTION_COUNT = 50000;

export const USER_BATCH_SIZE = 500;
export const DOCUMENT_BATCH_SIZE = 2000;
export const INGESTION_BATCH_SIZE = 2000;

export async function runSeeder(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(UserEntity);
  const docRepo = dataSource.getRepository(DocumentEntity);
  const ingestionRepo = dataSource.getRepository(IngestionEntity);

  console.time('Total Seeding Time');
  const editorIds: string[] = [];
  const hashedAdminPwd = BcryptUtil.hashPassword('Admin@123');
  const hashedUserPwd = BcryptUtil.hashPassword('User@123');

  // USERS
  console.time('User Insertion');
  const users: Partial<UserEntity>[] = [];

  users.push({
    fullName: 'Admin User',
    email: 'admin@gmail.com',
    password: hashedAdminPwd,
    role: UserRoleEnum.ADMIN,
  });

  for (let i = 1; i < USER_COUNT; i++) {
    const role = i % 2 === 0 ? UserRoleEnum.EDITOR : UserRoleEnum.VIEWER;
    users.push({
      fullName: `User ${i}`,
      email: `user${i}@gmail.com`,
      password: hashedUserPwd,
      role,
    });
  }

  for (let i = 0; i < users.length; i += USER_BATCH_SIZE) {
    const batch = users.slice(i, i + USER_BATCH_SIZE);
    const start = Date.now();
    const inserted = await userRepo.save(batch);
    const end = Date.now();
    console.log(
      `✅ Inserted user batch ${i / USER_BATCH_SIZE + 1} (${batch.length}) in ${end - start}ms`,
    );
    editorIds.push(
      ...inserted
        .filter((u) => u.role === UserRoleEnum.EDITOR)
        .map((u) => u.id),
    );
  }
  console.timeEnd('User Insertion');

  // DOCUMENTS
  console.time('Document Insertion');
  const totalDocs = DOCUMENT_COUNT;
  const docInsertTasks: Promise<any>[] = [];

  for (let i = 0; i < totalDocs; i += DOCUMENT_BATCH_SIZE) {
    const batch: Partial<DocumentEntity>[] = [];

    for (let j = 0; j < DOCUMENT_BATCH_SIZE && i + j < totalDocs; j++) {
      const userId = editorIds[(i + j) % editorIds.length];
      batch.push({
        title: `Document ${i + j + 1}`,
        description: `Description for document ${i + j + 1}`,
        fileName: `file${i + j + 1}.pdf`,
        filePath: `/uploads/file${i + j + 1}.pdf`,
        mimeType: 'application/pdf',
        size: 1000000 + ((i + j) % 500000),
        userId,
      });
    }

    const batchIndex = i / DOCUMENT_BATCH_SIZE + 1;
    const promise = (async () => {
      const start = Date.now();
      await docRepo.save(batch);
      const end = Date.now();
      console.log(
        `📄 Inserted document batch ${batchIndex} (${batch.length}) in ${end - start}ms`,
      );
    })();

    docInsertTasks.push(promise);
    // Control concurrency to avoid memory spikes
    if (docInsertTasks.length >= 5) {
      await Promise.all(docInsertTasks);
      docInsertTasks.length = 0;
    }
  }

  // Final pending batches
  await Promise.all(docInsertTasks);
  console.timeEnd('Document Insertion');

  // INGESTIONS
  console.time('Ingestion Insertion');

  // Fetch all documents, shuffle if needed, pick first 50K
  const allDocs = await docRepo
    .createQueryBuilder('doc')
    .select(['doc.id', 'doc.userId'])
    .getMany();

  const limitedDocs = allDocs.slice(0, INGESTION_COUNT);
  const ingestionInsertTasks: Promise<any>[] = [];
  const statuses = Object.values(IngestionStatusEnum);

  for (let i = 0; i < limitedDocs.length; i += INGESTION_BATCH_SIZE) {
    const batchDocs = limitedDocs.slice(i, i + INGESTION_BATCH_SIZE);
    const batch: Partial<IngestionEntity>[] = batchDocs.map((doc, idx) => {
      const status = statuses[(i + idx) % statuses.length];
      const isFailed = status === IngestionStatusEnum.FAILED;

      return {
        status,
        logs: `Log ${i + idx + 1}`,
        errorMessage: isFailed ? 'Failed to parse document' : undefined,
        finishedAt: (i + idx) % 3 === 0 ? new Date() : undefined,
        documentId: doc.id,
        userId: doc.userId,
      };
    });
    const batchIndex = i / INGESTION_BATCH_SIZE + 1;
    const promise = (async () => {
      const start = Date.now();
      await ingestionRepo.save(batch);
      const end = Date.now();
      console.log(
        `📦 Inserted ingestion batch ${batchIndex} (${batch.length}) in ${end - start}ms`,
      );
    })();

    ingestionInsertTasks.push(promise);
    if (ingestionInsertTasks.length >= 5) {
      await Promise.all(ingestionInsertTasks);
      ingestionInsertTasks.length = 0;
    }
  }

  await Promise.all(ingestionInsertTasks);
  console.timeEnd('Ingestion Insertion');
  console.timeEnd('Total Seeding Time');

  console.log('\n✅ Seeder finished successfully');
  console.log(`👥 Users inserted: ${USER_COUNT}`);
  console.log(`📄 Documents inserted: ${DOCUMENT_COUNT}`);
  console.log(`📦 Ingestions inserted: ${INGESTION_COUNT}`);
}
