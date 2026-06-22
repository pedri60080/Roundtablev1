import { Component, input, output } from '@angular/core';

export type TopicMinuteNotesCardVariant = 'embedded' | 'inline' | 'presentation';

@Component({
  selector: 'app-topic-minute-notes-card',
  standalone: true,
  template: `
    <article
      class="topic-minute-notes-card"
      [class.topic-minute-notes-card--presentation]="variant() === 'presentation'"
      [class.topic-minute-notes-card--embedded]="variant() === 'embedded'"
      [class.topic-minute-notes-card--inline]="variant() === 'inline'"
    >
      <div class="minute-notes-card-head">
        <h3 class="minute-notes-card-title">{{ heading() }}</h3>
        @if (isDraft()) {
          <span class="minute-notes-status minute-notes-status--draft">Draft</span>
        } @else {
          <span class="minute-notes-status minute-notes-status--final">Final</span>
        }
      </div>
      @if (error()) {
        <p class="minute-notes-card-error">{{ error() }}</p>
      }
      @if (readonly()) {
        <p class="minute-notes-card-readonly">{{ body() || '—' }}</p>
      } @else {
        <textarea
          class="minute-notes-card-textarea"
          [rows]="textareaRows()"
          [value]="body()"
          (input)="bodyChange.emit($any($event.target).value)"
          [disabled]="disabled()"
          [attr.aria-label]="ariaLabel()"
        ></textarea>
        <div class="minute-notes-card-actions">
          <button type="button" class="minute-notes-btn minute-notes-btn--primary" [disabled]="disabled()" (click)="save.emit()">
            Save
          </button>
          @if (isDraft()) {
            <button type="button" class="minute-notes-btn minute-notes-btn--secondary" [disabled]="disabled()" (click)="markFinal.emit()">
              Mark as finalised
            </button>
          }
          <button type="button" class="minute-notes-btn minute-notes-btn--secondary" [disabled]="disabled()" (click)="cancel.emit()">
            Cancel
          </button>
          <button type="button" class="minute-notes-btn minute-notes-btn--danger" [disabled]="disabled()" (click)="delete.emit()">
            Delete
          </button>
        </div>
      }
    </article>
  `,
  styles: [
    `
      .topic-minute-notes-card {
        margin: 0;
        padding: 16px 20px 18px;
        border-radius: 12px;
        border: 1px solid var(--m3-outline-variant);
        box-shadow: 0 1px 3px color-mix(in srgb, var(--m3-on-surface) 12%, transparent);
        background: color-mix(in srgb, var(--m3-surface-container-low) 40%, var(--m3-surface));
      }
      .topic-minute-notes-card--embedded {
        margin: 0;
        padding: 16px 20px 18px;
        border: none;
        border-radius: 0;
        border-top: 1px solid var(--m3-outline-variant);
        box-shadow: none;
        background: color-mix(in srgb, var(--m3-surface-container-low) 40%, var(--m3-surface));
      }
      .topic-minute-notes-card--inline {
        margin-top: 0;
      }
      .topic-minute-notes-card--presentation {
        margin: 0;
        padding: 2em;
        border-radius: var(--m3-shape-large);
        box-shadow: var(--m3-elevation-4);
        font-size: inherit;
      }
      .minute-notes-card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 8px;
        flex-wrap: wrap;
      }
      .minute-notes-card-title {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--m3-on-surface);
      }
      .topic-minute-notes-card--presentation .minute-notes-card-title {
        font-size: 1.125em;
      }
      .minute-notes-status {
        font-size: 0.75em;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 0.25em 0.5em;
        border-radius: var(--m3-shape-full);
      }
      .minute-notes-status--draft {
        background: var(--m3-secondary-container);
        color: var(--m3-on-secondary-container);
      }
      .minute-notes-status--final {
        background: color-mix(in srgb, var(--app-primary) 18%, transparent);
        color: var(--app-primary);
      }
      .minute-notes-card-error {
        margin: 0 0 0.5em;
        font-size: 0.875em;
        color: var(--m3-error);
        font-weight: 600;
      }
      .minute-notes-card-readonly {
        margin: 0;
        font-size: 0.9375rem;
        line-height: 1.55;
        white-space: pre-wrap;
        word-break: break-word;
        color: var(--m3-on-surface);
      }
      .topic-minute-notes-card--presentation .minute-notes-card-readonly {
        font-size: 0.9375em;
      }
      .minute-notes-card-textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 10px 12px;
        font-family: inherit;
        font-size: 0.875rem;
        border: 1px solid var(--m3-outline);
        border-radius: var(--m3-shape-small);
        background: var(--m3-surface);
        color: var(--m3-on-surface);
        resize: vertical;
        min-height: 5rem;
      }
      .topic-minute-notes-card--presentation .minute-notes-card-textarea {
        padding: 0.75em;
        font-size: 0.9375em;
        min-height: 6em;
      }
      .minute-notes-card-textarea:focus {
        outline: none;
        border-color: var(--app-primary);
      }
      .minute-notes-card-textarea:disabled {
        opacity: 0.55;
      }
      .minute-notes-card-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }
      .topic-minute-notes-card--presentation .minute-notes-card-actions {
        gap: 0.5em;
        margin-top: 0.75em;
      }
      .minute-notes-btn {
        padding: 0.5em 1em;
        font-family: inherit;
        font-size: 0.875em;
        font-weight: 600;
        border-radius: var(--m3-shape-small);
        cursor: pointer;
        border: none;
      }
      .minute-notes-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .minute-notes-btn--primary {
        background: var(--app-primary);
        color: var(--app-on-primary);
      }
      .minute-notes-btn--primary:hover:not(:disabled) {
        opacity: 0.92;
      }
      .minute-notes-btn--secondary {
        background: var(--m3-surface-container-high);
        color: var(--m3-on-surface);
        border: 1px solid var(--m3-outline-variant);
      }
      .minute-notes-btn--secondary:hover:not(:disabled) {
        background: var(--m3-surface-container);
      }
      .minute-notes-btn--danger {
        background: var(--m3-error-container);
        color: var(--m3-on-error-container);
        border: 1px solid var(--m3-error);
      }
      .minute-notes-btn--danger:hover:not(:disabled) {
        filter: brightness(0.96);
      }
    `,
  ],
})
export class TopicMinuteNotesCardComponent {
  readonly heading = input('Minutes');
  readonly variant = input<TopicMinuteNotesCardVariant>('inline');
  readonly isDraft = input(true);
  readonly body = input('');
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly error = input<string | null>(null);
  readonly textareaRows = input(4);
  readonly ariaLabel = input('Minutes');

  readonly bodyChange = output<string>();
  readonly save = output<void>();
  readonly markFinal = output<void>();
  readonly cancel = output<void>();
  readonly delete = output<void>();
}
