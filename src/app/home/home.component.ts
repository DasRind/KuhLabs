import { Component, HostListener, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'kl-home',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './home.component.scss',
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  ngOnInit() {
    if (this.isBrowser) {
      document.documentElement.setAttribute('data-home', '1');
      this.updateHeaderFade();
    }
  }

  @HostListener('window:scroll')
  onScroll() {
    if (this.isBrowser) this.updateHeaderFade();
  }

  @HostListener('window:resize')
  onResize() {
    // no-op for brand centering; handled purely in CSS now
  }

  private updateHeaderFade() {
    const viewport = window.innerHeight || 1;
    const y = window.scrollY || 0;
    const p = Math.max(0, Math.min(1, (y / viewport) * 2.4));
    document.documentElement.style.setProperty('--header-fade', p.toFixed(4));
  }

  // Removed JS measurement of brand container left; CSS computes it from viewport

  ngOnDestroy() {
    if (this.isBrowser) {
      document.documentElement.removeAttribute('data-home');
      document.documentElement.style.removeProperty('--header-fade');
    }
  }
}
