import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';

describe('application routes', () => {
  it('lazy loads every feature screen and recovers unknown paths', () => {
    const children = routes[0]?.children ?? [];
    const featureRoutes = children.filter((route) => route.path !== '**');
    expect(featureRoutes.length).toBeGreaterThan(0);
    expect(featureRoutes.every((route) => typeof route.loadComponent === 'function')).toBe(true);
    expect(children.at(-1)).toEqual(
      expect.objectContaining({ path: '**', redirectTo: '', pathMatch: 'full' }),
    );
  });

  it('gives every feature route a localized page-title key', () => {
    const featureRoutes = (routes[0]?.children ?? []).filter((route) => route.path !== '**');

    expect(featureRoutes.every((route) => typeof route.data?.['titleKey'] === 'string')).toBe(true);
  });
});
