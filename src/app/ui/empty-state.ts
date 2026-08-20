import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  imports: [RouterLink],
  template: `
    <div class="empty">
      <p>{{ message() }}</p>
      @if (actionLabel()) {
        <a class="button" [routerLink]="actionLink()">{{ actionLabel() }}</a>
      }
    </div>
  `,
})
export class EmptyState {
  readonly message = input.required<string>();
  readonly actionLabel = input('');
  readonly actionLink = input('/add');
}
