/** Hands a result to the system share sheet (or the clipboard when there is none). */
/** 'cancelled': the player closed the share sheet; 'failed': nothing worked, the text must be copied by hand. */
export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

export interface Sharer {
  /** Shares the text, with the picture attached when the platform can. */
  share(text: string, image?: Blob): Promise<ShareOutcome>;
}
