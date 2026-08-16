export class LedgerError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "LedgerError";
    this.code = code;
  }
}

export class InsufficientBalanceError extends LedgerError {
  constructor(message = "Insufficient balance for this operation.") {
    super("INSUFFICIENT_BALANCE", message);
  }
}

export class InvalidAmountError extends LedgerError {
  constructor(message = "Amount must be a positive, finite number.") {
    super("INVALID_AMOUNT", message);
  }
}
