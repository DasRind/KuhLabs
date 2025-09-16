import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterTestingHarness } from '@angular/router/testing';
import { ToolEmbedComponent } from './tool-embed.component';

describe('ToolEmbedComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [ToolEmbedComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(ToolEmbedComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});

