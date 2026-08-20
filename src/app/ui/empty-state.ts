import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from './icon';

@Component({
  selector: 'app-empty-state',
  imports: [RouterLink, Icon],
  template: `
    <div class="empty">
      <p>{{ message() }}</p>
      @if (actionLabel()) {
        <a class="button" [routerLink]="actionLink()">
          <app-icon name="add" />
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
}
