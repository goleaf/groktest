import { Component, input } from '@angular/core';

export type IconName =
  | 'brand'
  | 'home'
  | 'lent'
  | 'borrowed'
  | 'add'
  | 'more'
  | 'item'
  | 'money'
  | 'person'
  | 'people'
  | 'calendar'
  | 'overdue'
  | 'check'
  | 'note'
  | 'history'
  | 'settings'
  | 'back'
  | 'device'
  | 'chevron'
  | 'search'
  | 'records'
  | 'filter'
  | 'close'
  | 'info'
  | 'language'
  | 'download'
  | 'warning'
  | 'all'
  | 'clock';

@Component({
  selector: 'app-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @switch (name()) {
        @case ('brand') {
          <path d="M9 5H5v14h4M15 5h4v14h-4" />
          <path d="m8 9 4-3 4 3M16 15l-4 3-4-3" />
        }
        @case ('home') {
          <path d="M4 11.5 12 4l8 7.5V20H15v-6H9v6H4z" />
        }
        @case ('lent') {
          <path d="M7 17 17 7M10 7h7v7" />
        }
        @case ('borrowed') {
          <path d="M17 7 7 17M14 17H7v-7" />
        }
        @case ('add') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('more') {
          <circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none" />
        }
        @case ('item') {
          <path d="M4 8l8-3 8 3v9l-8 3-8-3z" />
          <path d="M12 5v15M4 8l8 3 8-3" />
        }
        @case ('money') {
          <rect x="3" y="7" width="18" height="10" rx="2" />
          <circle cx="12" cy="12" r="2.2" />
        }
        @case ('person') {
          <circle cx="12" cy="8" r="3" />
          <path d="M5.5 20c1.2-3.5 3.4-5 6.5-5s5.3 1.5 6.5 5" />
        }
        @case ('people') {
          <circle cx="9" cy="8" r="2.4" />
          <path d="M4 19c.8-2.8 2.4-4 5-4s4.2 1.2 5 4" />
          <circle cx="16.5" cy="8.5" r="2" />
          <path d="M15 19c.4-2 1.4-3.2 3.5-3.2 2 0 3.1 1.2 3.5 3.2" />
        }
        @case ('calendar') {
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M4 10h16M8 3v4M16 3v4" />
        }
        @case ('overdue') {
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5l3 2" />
        }
        @case ('check') {
          <path d="M5 12.5 9.5 17 19 7" />
        }
        @case ('note') {
          <path d="M7 4h8l4 4v12H7z" />
          <path d="M15 4v4h4M9 12h6M9 16h4" />
        }
        @case ('history') {
          <path d="M4 12a8 8 0 1 0 2.3-5.6" />
          <path d="M4 4v5h5M12 8v5l3 2" />
        }
        @case ('settings') {
          <circle cx="12" cy="12" r="3" />
          <path
            d="M12 3.5v2.2M12 18.3V20.5M4.9 6.4l1.6 1.6M17.5 16l1.6 1.6M3.5 12H5.7M18.3 12h2.2M4.9 17.6l1.6-1.6M17.5 8l1.6-1.6"
          />
        }
        @case ('back') {
          <path d="M14 5 7 12l7 7" />
        }
        @case ('device') {
          <rect x="7" y="3" width="10" height="18" rx="2" />
          <path d="M11 18h2" />
        }
        @case ('chevron') {
          <path d="M9 5l7 7-7 7" />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="6" />
          <path d="M16 16l5 5" />
        }
        @case ('records') {
          <path d="M7 5h13M7 12h13M7 19h13" />
          <path d="M3.5 5h.01M3.5 12h.01M3.5 19h.01" stroke-width="3" />
        }
        @case ('filter') {
          <path d="M4 6h16M7 12h10M10 18h4" />
        }
        @case ('close') {
          <path d="M6 6l12 12M18 6 6 18" />
        }
        @case ('info') {
          <circle cx="12" cy="12" r="8" />
          <path d="M12 11v5M12 8h.01" />
        }
        @case ('language') {
          <circle cx="12" cy="12" r="8" />
          <path
            d="M4.5 9h15M4.5 15h15M12 4c2 2.2 3 4.9 3 8s-1 5.8-3 8M12 4c-2 2.2-3 4.9-3 8s1 5.8 3 8"
          />
        }
        @case ('download') {
          <path d="M12 4v11M8 11l4 4 4-4" />
          <path d="M5 18v2h14v-2" />
        }
        @case ('warning') {
          <path d="M12 4 3.8 19h16.4z" />
          <path d="M12 9v4M12 16h.01" />
        }
        @case ('all') {
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <rect x="14" y="14" width="6" height="6" rx="1" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7v5l3 2" />
        }
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
}
