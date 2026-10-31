import { NavigationPort } from '../../../domain/console/port/NavigationPort';

/** Leaves the terminal for another page of the site, after a short beat so the response can be read. */
export class BrowserNavigationAdapter implements NavigationPort {
  constructor(private readonly delayMs = 700) {}

  navigateTo(path: string): void {
    window.setTimeout(() => window.location.assign(path), this.delayMs);
  }
}
