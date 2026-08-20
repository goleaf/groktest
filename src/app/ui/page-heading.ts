import { Component, input } from '@angular/core';
import { Icon, type IconName } from './icon';

@Component({
  selector: 'app-page-heading',
  imports: [Icon],
  template: `
    <header class="page-header page-heading">
      <span class="heading-icon" aria-hidden="true"><app-icon [name]="icon()" /></span>
      <div class="page-heading-copy">
        <h1>{{ title() }}</h1>
        @if (intro()) {
          <p class="page-intro">{{ intro() }}</p>
        }
      </div>
    </header>
  `,
})
export class PageHeading {
  readonly icon = input.required<IconName>();
  readonly title = input.required<string>();
  readonly intro = input('');
}
