import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Shell } from './shell';

describe('Shell', () => {
  it('renders the five primary destinations', async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Borrowed');
    expect(text).toContain('On this device');
    expect(text).toContain('Home');
    expect(text).toContain('Lent');
    expect(text).toContain('Add');
    expect(text).toContain('Borrowed');
    expect(text).toContain('More');
  });
});
