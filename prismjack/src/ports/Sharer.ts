/** Hands a result to the system share sheet (or the clipboard when there is none). */
export type ShareOutcome = 'shared' | 'copied' | 'failed';

export interface Sharer {
  /** Shares the text, with the picture attached when the platform can. */
  share(text: string, image?: Blob): Promise<ShareOutcome>;
}
