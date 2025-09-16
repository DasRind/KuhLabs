import { TestBed } from '@angular/core/testing';
import { ToolsListComponent } from './tools-list.component';

describe('ToolsListComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ToolsListComponent],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ToolsListComponent);
    const comp = fixture.componentInstance;
    expect(comp).toBeTruthy();
  });
});

