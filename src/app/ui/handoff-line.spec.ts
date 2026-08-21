import { TestBed } from '@angular/core/testing';
import { I18n } from '../i18n/i18n';
import { HandoffLine } from './handoff-line';

async function render(
  direction: 'lent' | 'borrowed',
  personName: string,
  language: 'en' | 'ru' | 'lt' = 'en',
): Promise<HTMLElement> {
  await TestBed.configureTestingModule({ imports: [HandoffLine] }).compileComponents();
  const fixture = TestBed.createComponent(HandoffLine);
  TestBed.inject(I18n).setLanguage(language);
  fixture.componentRef.setInput('direction', direction);
  fixture.componentRef.setInput('personName', personName);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('HandoffLine', () => {
  it('shows who handed the record to whom without relying on color', async () => {
    const lent = await render('lent', 'Peter');
    expect(lent.textContent).toContain('You');
    expect(lent.textContent).toContain('Peter');
    expect(lent.querySelector('.handoff-line')?.getAttribute('aria-label')).toBe(
      'You lent this to Peter',
    );
    expect(lent.querySelector('.handoff-arrow app-icon')).toBeTruthy();

    TestBed.resetTestingModule();
    const borrowed = await render('borrowed', 'Anna');
    expect(borrowed.textContent).toContain('Anna');
    expect(borrowed.textContent).toContain('You');
    expect(borrowed.querySelector('.handoff-line')?.getAttribute('aria-label')).toBe(
      'Anna lent this to you',
    );
  });

  it('localizes the local-user label and accessible sentence', async () => {
    const root = await render('lent', 'Пётр', 'ru');
    expect(root.textContent).toContain('Вы');
    expect(root.querySelector('.handoff-line')?.getAttribute('aria-label')).toBe(
      'Вы дали это человеку Пётр',
    );
  });
});
