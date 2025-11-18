// Base class untuk semua error layanan yang terkontrol
export class ServiceError extends Error {
  constructor(message, code) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

// Error spesifik yang bisa kita tangkap di controller
export class CampaignInactiveError extends ServiceError {
  constructor(message = 'This campaign is not active or has expired.') {
    super(message, 'CAMPAIGN_INACTIVE');
  }
}

export class NoCouponsLeftError extends ServiceError {
  constructor(message = 'You do not have enough coupons.') {
    super(message, 'NO_COUPONS_LEFT');
  }
}

export class NoPrizesAvailableError extends ServiceError {
  constructor(message = 'Sorry, all prizes are currently out of stock.') {
    super(message, 'NO_PRIZES_AVAILABLE');
  }
}

export class PrizeSelectionError extends ServiceError {
  constructor(message = 'Could not select a prize due to high demand. Please try again.') {
      super(message, 'PRIZE_SELECTION_FAILED');
  }
}

// --- CLASS BARU YANG HILANG DITAMBAHKAN DI SINI ---
export class BoxAlreadyOpenedError extends ServiceError {
  constructor(message = 'This mystery box has already been opened.') {
    super(message, 'BOX_ALREADY_OPENED');
  }
}