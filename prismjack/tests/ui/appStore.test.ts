import { describe, expect, it } from 'vitest';
import { appStoreUrl } from '../../src/ui/appStore';

const IPHONE = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', maxTouchPoints: 5 };
const IPAD = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 5 };
const MAC = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 0 };
const ANDROID = { userAgent: 'Mozilla/5.0 (Linux; Android 14)', maxTouchPoints: 5 };

describe('the App Store suggestion', () => {
  it('is offered on the web version on an iPhone or iPad', () => {
    expect(appStoreUrl('123', false, IPHONE)).toBe('https://apps.apple.com/app/id123');
    expect(appStoreUrl('123', false, IPAD)).toBe('https://apps.apple.com/app/id123');
  });

  it('is not offered inside the app, on other devices, or without an App Store id', () => {
    expect(appStoreUrl('123', true, IPHONE)).toBeNull();
    expect(appStoreUrl('123', false, MAC)).toBeNull();
    expect(appStoreUrl('123', false, ANDROID)).toBeNull();
    expect(appStoreUrl(undefined, false, IPHONE)).toBeNull();
  });
});
