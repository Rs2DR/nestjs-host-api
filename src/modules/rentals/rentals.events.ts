export class RentalActivatedEvent {
  constructor(
    public readonly rentalId: string,
    public readonly endsAt: Date,
  ) {}
}

export class RentalCancelledEvent {
  constructor(public readonly rentalId: string) {}
}

export class RentalExpiredEvent {
  constructor(public readonly rentalId: string) {}
}
