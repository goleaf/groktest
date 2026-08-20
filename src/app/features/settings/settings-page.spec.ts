import { TestBed } from '@angular/core/testing';
import { BorrowedApp } from '../../data/borrowed-app';
import { SettingsPage } from './settings-page';

describe('SettingsPage', () => {
  it('groups preferences separately from local data controls', async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        {
          provide: BorrowedApp,
          useValue: { settings: async () => ({ preferredCurrency: 'EUR' }) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const groups = root.querySelectorAll('.settings-group');

    expect(groups).toHaveLength(3);
    expect(groups[0]?.textContent).toContain('Preferences');
    expect(groups[0]?.textContent).toContain('Preferred currency');
    expect(groups[1]?.textContent).toContain('Your data');
    expect(groups[1]?.textContent).toContain('Your records stay on this device');
    expect(groups[1]?.querySelector('button')?.textContent).toContain('Download my data');
    expect(groups[2]?.textContent).toContain('About Borrowed');
  });
});
