export interface NotificationJob {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}
