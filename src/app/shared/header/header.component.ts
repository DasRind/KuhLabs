import { Component, AfterViewInit, ElementRef, HostListener, Inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { ThemeService } from '../../core/theme';

@Component({
  selector: 'kl-header',
  standalone: true,
  imports: [RouterLink, NgIf],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements AfterViewInit {
  constructor(
    public theme: ThemeService,
    private el: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) private pid: Object,
    private router: Router,
  ) {}

  toggleTheme() {
    this.theme.toggle();
  }

  ngAfterViewInit() {
    this.updateHeaderHeight();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateHeaderHeight();
  }

  private updateHeaderHeight() {
    if (!isPlatformBrowser(this.pid)) return;
    const h = this.el.nativeElement?.offsetHeight || 0;
    document.documentElement.style.setProperty('--header-h', `${h}px`);
  }

  // Brand container left is computed purely in CSS to avoid initial layout jumps

  onBrandClick(ev: MouseEvent) {
    if (!isPlatformBrowser(this.pid)) return;
    const current = this.router.url.split('?')[0].split('#')[0];
    if (current === '/' || current === '') {
      ev.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
