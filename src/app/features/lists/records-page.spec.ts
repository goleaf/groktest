import { describe, expect, it } from 'vitest';
import { routes } from '../../app.routes';

describe('records route', () => {
  it('registers one shared destination for every active record', () => {
    const route = routes[0]?.children?.find((candidate) => candidate.path === 'records');
    expect(route).toBeTruthy();
    expect(route?.component).toBeUndefined();
    expect(route?.loadComponent).toBeTypeOf('function');
  });
});
