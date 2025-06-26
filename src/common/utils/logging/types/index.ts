type LogBasicDetails = {
  message: string;
  action: string;
  source: string;
  data?: unknown;
  xRequestId?: string;
  durationMs?: number;
} & { [key: string]: any };

export type LogError = LogBasicDetails & {
  error?: Error;
  errorMessage?: string;
  errorCode?: string | number;
  errorStack?: unknown;
};

export type LogInfo = LogBasicDetails;

export type LogDetails = LogBasicDetails & LogError;

export type LogLabels = {
  requestId: string;
  action: string;
  source: string;
};
