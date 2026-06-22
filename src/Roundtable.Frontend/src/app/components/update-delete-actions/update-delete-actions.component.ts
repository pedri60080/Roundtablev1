import { Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Inline update + delete actions:
 * - Initial state: [update] [delete]
 * - After pressing delete: [confirm (warn)] [cancel]
 *
 * No dialog; parents listen to (update) and (confirm) outputs.
 */
@Component({
  selector: 'app-update-delete-actions',
  standalone: true,
  imports: [MatButtonModule, MatTooltipModule],
  template: `
    <span class="update-delete-actions" (click)="$event.stopPropagation()">
      @if (!confirmMode()) {
        @if (showUpdate()) {
          <button
            mat-icon-button
            type="button"
            (click)="onUpdate()"
            [matTooltip]="updateTooltip()"
            [attr.aria-label]="updateTooltip()"
          >
            <span class="material-symbols-outlined">edit</span>
          </button>
        }
        @if (showDelete()) {
          <button
            mat-icon-button
            type="button"
            (click)="confirmMode.set(true)"
            [matTooltip]="deleteTooltip()"
            [attr.aria-label]="deleteTooltip()"
          >
            <span class="material-symbols-outlined">delete</span>
          </button>
        }
      } @else {
        <button
          mat-icon-button
          type="button"
          color="warn"
          (click)="onConfirm()"
          [matTooltip]="confirmTooltip()"
          [attr.aria-label]="confirmTooltip()"
        >
          <span class="material-symbols-outlined">delete</span>
        </button>
        <button
          mat-icon-button
          type="button"
          (click)="confirmMode.set(false)"
          [matTooltip]="cancelTooltip()"
          [attr.aria-label]="cancelTooltip()"
        >
          <span class="material-symbols-outlined">close</span>
        </button>
      }
    </span>
  `,
  styles: [`
    .update-delete-actions {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0;
      min-width: 96px;
      box-sizing: border-box;
    }
    .update-delete-actions .material-symbols-outlined {
      font-size: 24px;
    }
  `],
})
export class UpdateDeleteActionsComponent {
  readonly showUpdate = input<boolean>(true);
  readonly showDelete = input<boolean>(true);
  readonly updateTooltip = input<string>('Edit topic');
  readonly deleteTooltip = input<string>('Delete topic');
  readonly confirmTooltip = input<string>('Confirm delete');
  readonly cancelTooltip = input<string>('Cancel');

  readonly update = output<void>();
  readonly confirm = output<void>();

  protected readonly confirmMode = signal(false);

  protected onConfirm(): void {
    this.confirm.emit();
    this.confirmMode.set(false);
  }

  protected onUpdate(): void {
    this.update.emit();
  }
}
