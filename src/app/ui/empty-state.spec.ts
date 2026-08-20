import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('always provides a semantic leading icon', async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyState],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(EmptyState);
    fixture.componentRef.setInput('message', 'No records yet');
    fixture.detectChanges();

    const icon = fixture.nativeElement.querySelector('.empty-icon app-icon');
    expect(icon).toBeTruthy();
  });
});
