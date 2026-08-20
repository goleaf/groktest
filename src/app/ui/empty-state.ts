import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon, type IconName } from './icon';

@Component({
  selector: 'app-empty-state',
  imports: [RouterLink, Icon],
  template: `
    <div class="empty">
      <span class="empty-icon" aria-hidden="true"><app-icon [name]="icon()" /></span>
      <p>{{ message() }}</p>
      @if (actionLabel()) {
        <a class="button" [routerLink]="actionLink()">
          <app-icon [name]="actionIcon()" />
          {{ actionLabel() }}
        </a>
      }
    </div>
  `,
})
export class EmptyState {
  readonly message = input.required<string>();
  readonly actionLabel = input('');
  readonly actionLink = input('/add');
  readonly icon = input<IconName>('records');
  readonly actionIcon = input<IconName>('add');
}
