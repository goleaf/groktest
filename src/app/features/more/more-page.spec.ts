import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MorePage } from './more-page';

describe('MorePage', () => {
  it('groups secondary destinations and explains local storage', async () => {
    await TestBed.configureTestingModule({
      imports: [MorePage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(MorePage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.more-group h2')?.textContent).toContain('Your records');
    expect(root.querySelector('.more-group a[href="/people"]')).toBeTruthy();
    expect(root.querySelector('.more-group a[href="/history"]')).toBeTruthy();
    expect(root.querySelector('.local-data-note')?.textContent).toContain('On this device');
  });
});
