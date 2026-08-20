import { Component } from '@angular/core';
import { ListPage } from './list-page';

@Component({
  selector: 'app-borrowed-page',
  imports: [ListPage],
  template: `
    <app-list-page
      direction="borrowed"
      titleKey="borrowed.title"
      emptyKey="borrowed.empty"
      emptyActionKey="borrowed.emptyAction"
    />
  `,
})
export class BorrowedPage {}
