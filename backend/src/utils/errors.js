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
  constructor(message = 'Program ini tidak aktif atau sudah berakhir.') {
    super(message, 'CAMPAIGN_INACTIVE');
  }
}

export class NoCouponsLeftError extends ServiceError {
  constructor(message = 'Kupon Anda tidak mencukupi.') {
    super(message, 'NO_COUPONS_LEFT');
  }
}

export class NoPrizesAvailableError extends ServiceError {
  constructor(message = 'Maaf, semua hadiah sedang habis.') {
    super(message, 'NO_PRIZES_AVAILABLE');
  }
}

export class PrizeSelectionError extends ServiceError {
  constructor(message = 'Hadiah tidak bisa dipilih karena kendala sistem. Silakan coba lagi.') {
      super(message, 'PRIZE_SELECTION_FAILED');
  }
}

// --- CLASS BARU YANG HILANG DITAMBAHKAN DI SINI ---
export class BoxAlreadyOpenedError extends ServiceError {
  constructor(message = 'Box ini sudah dibuka distributor lain. Pilih box lain.') {
    super(message, 'BOX_ALREADY_OPENED');
  }
}
