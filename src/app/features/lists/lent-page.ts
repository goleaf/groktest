import { Component } from '@angular/core';
import { ListPage } from './list-page';

@Component({
  selector: 'app-lent-page',
  imports: [ListPage],
  template: `
    <app-list-page
      direction="lent"
      titleKey="lent.title"
      emptyKey="lent.empty"
      emptyActionKey="lent.emptyAction"
    />
  `,
})
export class LentPage {}
