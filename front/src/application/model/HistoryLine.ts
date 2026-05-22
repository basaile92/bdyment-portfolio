export default class HistoryLine {
  private readonly _date: string;
  private readonly _command: string;
  private readonly _response: string | undefined;

  constructor(command: string, response: string | undefined) {
    this._date = new Date().toISOString();
    this._command = command;
    this._response = response;
  }
  get date(): string {
    return this._date;
  }

  get command(): string {
    return this._command;
  }

  get response(): string | undefined {
    return this._response;
  }
}
