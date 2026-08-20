import { Component } from '@angular/core';
import { ListPage } from './list-page';

@Component({
  selector: 'app-records-page',
  imports: [ListPage],
  template: `
    <app-list-page
      direction="all"
      titleKey="records.title"
      emptyKey="records.empty"
      emptyActionKey="records.emptyAction"
      icon="records"
    />
  `,
})
export class RecordsPage {}
