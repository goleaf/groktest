import { Routes } from '@angular/router';
import { AddPage } from './features/add/add-page';
import { DetailPage } from './features/detail/detail-page';
import { HistoryPage } from './features/history/history-page';
import { HomePage } from './features/home/home-page';
import { BorrowedPage } from './features/lists/borrowed-page';
import { LentPage } from './features/lists/lent-page';
import { MorePage } from './features/more/more-page';
import { PeoplePage } from './features/people/people-page';
import { PersonPage } from './features/people/person-page';
import { SettingsPage } from './features/settings/settings-page';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', component: HomePage },
      { path: 'lent', component: LentPage },
      { path: 'borrowed', component: BorrowedPage },
      { path: 'add', component: AddPage },
      { path: 'loans/:id', component: DetailPage },
      { path: 'more', component: MorePage },
      { path: 'history', component: HistoryPage },
      { path: 'people', component: PeoplePage },
      { path: 'people/:id', component: PersonPage },
      { path: 'settings', component: SettingsPage },
    ],
  },
];
