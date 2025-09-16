import { Component, inject, AfterViewInit, ElementRef, ViewChild, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { getToolBySlug, ToolDefinition } from '../tools.data';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Location } from '@angular/common';

@Component({
  selector: 'kl-tool-embed',
  standalone: true,
  templateUrl: './tool-embed.component.html',
  styleUrl: './tool-embed.component.scss',
})
export class ToolEmbedComponent implements AfterViewInit {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  private location = inject(Location);
  private router = inject(Router);

  tool?: ToolDefinition;
  safeUrl?: SafeResourceUrl;
  fromTag?: string | null;
  // Removed page scroll lock to allow outer page scrolling normally

  constructor(@Inject(PLATFORM_ID) private pid: Object) {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    const t = getToolBySlug(slug);
    this.tool = t;
    if (t?.externalUrl) {
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(t.externalUrl);
    }
    // Prefer navigation state to know where to go back to (browser only)
    if (isPlatformBrowser(this.pid)) {
      const nav = this.router.getCurrentNavigation();
      const hs: any = (typeof history !== 'undefined' && (history as any).state) ? (history as any).state : null;
      this.fromTag = (nav?.extras?.state as any)?.fromTag ?? (hs && hs.fromTag) ?? null;
    } else {
      this.fromTag = null;
    }

    // Lock outer page scroll while the tool view is active
    // allow outer page to scroll; inner frame prevents scroll chaining via guards (see ngAfterViewInit)
  }

  back() {
    const target = (this.fromTag || this.pickBestTag(this.tool))?.toLowerCase();
    if (target) {
      const path = target === 'tools' ? '/tools' : target === 'jugger' ? '/jugger' : target === 'games' ? '/games' : '/tools';
      this.router.navigateByUrl(path);
    } else {
      // Fallback: go to generic tools overview
      this.router.navigateByUrl('/tools');
    }
  }

  private pickBestTag(t?: ToolDefinition): string | null {
    const tags = (t?.tags || []).map((x) => x.toLowerCase());
    if (!tags.length) return null;
    if (tags.includes('jugger')) return 'jugger';
    if (tags.includes('tools')) return 'tools';
    if (tags.includes('games')) return 'games';
    return tags[0];
  }

  @ViewChild('frame', { static: false }) frameRef?: ElementRef<HTMLIFrameElement>;
  private zone = inject(NgZone);
  ngAfterViewInit(): void {
    // When iframe loads, inject guards to prevent scroll from bubbling to outer page at edges
    const iframe = this.frameRef?.nativeElement;
    if (!iframe) return;
    iframe.addEventListener('load', () => {
      this.zone.runOutsideAngular(() => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!doc) return;
          // Apply overscroll behavior inside the iframe as well
          (doc.documentElement as HTMLElement).style.overscrollBehavior = 'contain';
          (doc.body as HTMLElement).style.overscrollBehavior = 'contain';

          const scrollEl = (doc.scrollingElement || doc.documentElement) as HTMLElement;
          const guardWheel = (ev: WheelEvent) => {
            const { scrollTop, scrollHeight, clientHeight } = scrollEl;
            const atTop = scrollTop <= 0;
            const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
            if ((atTop && ev.deltaY < 0) || (atBottom && ev.deltaY > 0)) {
              ev.preventDefault();
            }
          };
          const guardTouch = (function () {
            let lastY = 0;
            return (ev: TouchEvent) => {
              if (ev.type === 'touchstart') {
                lastY = ev.touches[0]?.clientY ?? 0;
                return;
              }
              if (ev.type === 'touchmove') {
                const y = ev.touches[0]?.clientY ?? 0;
                const dy = lastY - y; // positive when moving up (scroll down)
                const { scrollTop, scrollHeight, clientHeight } = scrollEl;
                const atTop = scrollTop <= 0;
                const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
                if ((atTop && dy < 0) || (atBottom && dy > 0)) {
                  ev.preventDefault();
                }
                lastY = y;
              }
            };
          })();

          doc.addEventListener('wheel', guardWheel, { passive: false });
          doc.addEventListener('touchstart', guardTouch, { passive: false });
          doc.addEventListener('touchmove', guardTouch, { passive: false });
        } catch {
          // Cross-origin or other access issues: ignore
        }
      });
    });
  }

  // no-op
}
