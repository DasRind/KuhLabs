import { Injectable, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private isDarkSig = signal(false);

  constructor(@Inject(PLATFORM_ID) private pid: Object) {
    if (isPlatformBrowser(this.pid)) {
      const saved = localStorage.getItem('theme');
      const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = (saved ?? (prefersDark ? 'dark' : 'light')) as
        | 'dark'
        | 'light';
      this.apply(initial);
    }
  }

  get isDark() {
    return this.isDarkSig();
  }

  toggle() {
    this.apply(this.isDarkSig() ? 'light' : 'dark');
  }

  private apply(mode: 'light' | 'dark') {
    if (!isPlatformBrowser(this.pid)) return;
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('theme', mode);
    this.isDarkSig.set(mode === 'dark');
  }
}
