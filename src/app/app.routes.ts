import { Routes } from '@angular/router';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      {
        path: '',
        data: { titleKey: 'home.title' },
        loadComponent: () => import('./features/home/home-page').then((module) => module.HomePage),
      },
      {
        path: 'records',
        data: { titleKey: 'records.title' },
        loadComponent: () =>
          import('./features/lists/records-page').then((module) => module.RecordsPage),
      },
      {
        path: 'lent',
        data: { titleKey: 'lent.title' },
        loadComponent: () => import('./features/lists/lent-page').then((module) => module.LentPage),
      },
      {
        path: 'borrowed',
        data: { titleKey: 'borrowed.title' },
        loadComponent: () =>
          import('./features/lists/borrowed-page').then((module) => module.BorrowedPage),
      },
      {
        path: 'add',
        data: { titleKey: 'add.title' },
        loadComponent: () => import('./features/add/add-page').then((module) => module.AddPage),
      },
      {
        path: 'loans/:id',
        data: { titleKey: 'detail.title' },
        loadComponent: () =>
          import('./features/detail/detail-page').then((module) => module.DetailPage),
      },
      {
        path: 'more',
        data: { titleKey: 'more.title' },
        loadComponent: () => import('./features/more/more-page').then((module) => module.MorePage),
      },
      {
        path: 'search',
        data: { titleKey: 'search.title' },
        loadComponent: () =>
          import('./features/search/search-page').then((module) => module.SearchPage),
      },
      {
        path: 'history',
        data: { titleKey: 'history.title' },
        loadComponent: () =>
          import('./features/history/history-page').then((module) => module.HistoryPage),
      },
      {
        path: 'people',
        data: { titleKey: 'people.title' },
        loadComponent: () =>
          import('./features/people/people-page').then((module) => module.PeoplePage),
      },
      {
        path: 'people/:id',
        data: { titleKey: 'people.title' },
        loadComponent: () =>
          import('./features/people/person-page').then((module) => module.PersonPage),
      },
      {
        path: 'settings',
        data: { titleKey: 'settings.title' },
        loadComponent: () =>
          import('./features/settings/settings-page').then((module) => module.SettingsPage),
      },
      { path: '**', redirectTo: '', pathMatch: 'full' },
    ],
  },
];
