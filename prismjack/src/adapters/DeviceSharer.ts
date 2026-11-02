import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { ShareOutcome, Sharer } from '../ports/Sharer';

const FILE = 'prismjack-result.png';

/** The native share sheet on iOS / Android; the Web Share API or the clipboard in a browser. */
export class DeviceSharer implements Sharer {
  constructor(private readonly native: boolean) {}

  async share(text: string, image?: Blob): Promise<ShareOutcome> {
    try {
      if (this.native) return await this.shareNative(text, image);
      return await this.shareWeb(text, image);
    } catch (error) {
      // Closing the share sheet is not a failure worth reporting.
      if (error instanceof Error && /cancel|abort/i.test(`${error.name} ${error.message}`)) return 'cancelled';
      return this.copy(text);
    }
  }

  private async shareNative(text: string, image?: Blob): Promise<ShareOutcome> {
    if (!image) {
      await Share.share({ text });
      return 'shared';
    }
    const { uri } = await Filesystem.writeFile({ path: FILE, data: await base64(image), directory: Directory.Cache });
    await Share.share({ text, files: [uri] });
    return 'shared';
  }

  private async shareWeb(text: string, image?: Blob): Promise<ShareOutcome> {
    const files = image ? [new File([image], FILE, { type: 'image/png' })] : [];
    if (files.length && navigator.canShare?.({ files })) {
      await navigator.share({ text, files });
      return 'shared';
    }
    if (typeof navigator.share === 'function') {
      await navigator.share({ text });
      return 'shared';
    }
    return this.copy(text);
  }

  private async copy(text: string): Promise<ShareOutcome> {
    try {
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch {
      return 'failed';
    }
  }
}

function base64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(blob);
  });
}
