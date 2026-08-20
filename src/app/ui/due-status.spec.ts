import { TestBed } from '@angular/core/testing';
import { I18n } from '../i18n/i18n';
import { DueStatus } from './due-status';

async function render(
  dueOn: string,
  daysUntilDue: number,
  language: 'en' | 'ru' | 'lt' = 'en',
): Promise<HTMLElement> {
  await TestBed.configureTestingModule({ imports: [DueStatus] }).compileComponents();
  const fixture = TestBed.createComponent(DueStatus);
  TestBed.inject(I18n).setLanguage(language);
  fixture.componentRef.setInput('dueOn', dueOn);
  fixture.componentRef.setInput('daysUntilDue', daysUntilDue);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('DueStatus', () => {
  it('renders calendar-relative reminder states through one semantic component', async () => {
    let root = await render('2026-08-20', 0);
    expect(root.textContent).toContain('Due today');
    expect(root.querySelector('app-icon')).toBeTruthy();

    TestBed.resetTestingModule();
    root = await render('2026-08-21', 1);
    expect(root.textContent).toContain('Due tomorrow');

    TestBed.resetTestingModule();
    root = await render('2026-08-23', 3);
    expect(root.textContent).toContain('Due in 3 days');

    TestBed.resetTestingModule();
    root = await render('2026-08-16', -4);
    expect(root.textContent).toContain('Overdue by 4 days');
    expect(root.querySelector('.is-overdue')).toBeTruthy();
  });

  it('uses an ordinary localized date outside the early-warning window', async () => {
    const root = await render('2026-09-10', 21);
    expect(root.textContent).toContain('Due 10 Sept 2026');
    expect(root.querySelector('.is-due-soon')).toBeNull();
  });

  it('uses the active language and plural rules', async () => {
    let root = await render('2026-08-16', -4, 'ru');
    expect(root.textContent).toContain('Просрочено на 4 дня');

    TestBed.resetTestingModule();
    root = await render('2026-08-18', -2, 'lt');
    expect(root.textContent).toContain('Vėluoja 2 dienas');
  });
});
