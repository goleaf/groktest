import { Routes } from '@angular/router';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home-page').then((module) => module.HomePage),
      },
      {
        path: 'records',
        loadComponent: () =>
          import('./features/lists/records-page').then((module) => module.RecordsPage),
      },
      {
        path: 'lent',
        loadComponent: () => import('./features/lists/lent-page').then((module) => module.LentPage),
      },
      {
        path: 'borrowed',
        loadComponent: () =>
          import('./features/lists/borrowed-page').then((module) => module.BorrowedPage),
      },
      {
        path: 'add',
        loadComponent: () => import('./features/add/add-page').then((module) => module.AddPage),
      },
      {
        path: 'loans/:id',
        loadComponent: () =>
          import('./features/detail/detail-page').then((module) => module.DetailPage),
      },
      {
        path: 'more',
        loadComponent: () => import('./features/more/more-page').then((module) => module.MorePage),
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./features/search/search-page').then((module) => module.SearchPage),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/history/history-page').then((module) => module.HistoryPage),
      },
      {
        path: 'people',
        loadComponent: () =>
          import('./features/people/people-page').then((module) => module.PeoplePage),
      },
      {
        path: 'people/:id',
        loadComponent: () =>
          import('./features/people/person-page').then((module) => module.PersonPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings-page').then((module) => module.SettingsPage),
      },
      { path: '**', redirectTo: '', pathMatch: 'full' },
    ],
  },
];
