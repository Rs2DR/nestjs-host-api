export class NotificationRequestedEvent {
  constructor(
    public readonly tokens: string[],
    public readonly title: string,
    public readonly body: string,
    public readonly data?: Record<string, string>,
    public readonly delay?: number,
  ) {}
}
