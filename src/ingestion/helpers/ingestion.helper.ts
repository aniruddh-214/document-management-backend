import IngestionStatusEnum from '../enums/ingestion.enum';

export const determineIngestionOutcome = (
  random: () => number = Math.random,
): {
  status: IngestionStatusEnum;
  logs: string;
  errorMessage?: string;
} => {
  const success = random() > 0.2;
  const now = new Date().toUTCString();

  return success
    ? {
        status: IngestionStatusEnum.COMPLETED,
        logs: `Completed successfully at ${now}`,
      }
    : {
        status: IngestionStatusEnum.FAILED,
        logs: `Failed at ${now}`,
        errorMessage: 'Simulated ingestion failure',
      };
};
