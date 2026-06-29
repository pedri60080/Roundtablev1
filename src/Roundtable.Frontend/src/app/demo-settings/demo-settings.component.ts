import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DemoVersionSettingsService, type DemoSettingsDto } from '../demo-version-settings.service';
import { resolveUnderAppBase } from '../core/app-base-url';

@Component({
  selector: 'app-demo-settings',
  standalone: true,
  imports: [RouterLink, MatSnackBarModule],
  template: `
    <div class="demo-settings-page">
      <header class="page-head">
        <a routerLink="/" class="back-link">← Home</a>
        <h1 class="page-title">Demo settings</h1>
        <p class="page-lead">
          App name, minutes toggle, organisation and team display names are saved to
          <code>App_Data/DemoSeedData.json</code> and applied to the database on save.
        </p>
      </header>

      @if (loadError()) {
        <p class="banner-error">{{ loadError() }}</p>
      }

      <section class="card">
        <h2 class="section-title">App name</h2>
        <label class="field">
          <span class="field-label">Home page title</span>
          <input
            class="field-input"
            type="text"
            [value]="appDisplayName()"
            (input)="appDisplayName.set($any($event.target).value)"
            autocomplete="off"
          />
        </label>
      </section>

      <section class="card">
        <h2 class="section-title">Minutes</h2>
        <label class="check-row">
          <input
            type="checkbox"
            [checked]="includingMinutes()"
            (change)="includingMinutes.set($any($event.target).checked)"
          />
          <span>Including minutes</span>
        </label>
      </section>

      <section class="card">
        <h2 class="section-title">Organisation names</h2>
        <p class="section-help">
          The first organisation in this list is the fixed default assigned to the demo user (<code>user123</code>).
        </p>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Name</th>
                <th scope="col">Notes</th>
              </tr>
            </thead>
            <tbody>
              @for (name of orgNames(); track $index) {
                <tr>
                  <td class="cell-muted">{{ $index + 1 }}</td>
                  <td>
                    <input
                      class="field-input field-input--table"
                      type="text"
                      [value]="name"
                      (input)="onOrgNameInput($index, $any($event.target).value)"
                    />
                  </td>
                  <td class="cell-note">
                    @if ($index === 0) {
                      <span class="org-default-badge">Demo user default</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section class="card">
        <h2 class="section-title">Team names</h2>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Id</th>
                <th scope="col">Name</th>
              </tr>
            </thead>
            <tbody>
              @for (t of teams(); track t.id) {
                <tr>
                  <td class="cell-id">{{ t.id }}</td>
                  <td>
                    <input
                      class="field-input field-input--table"
                      type="text"
                      [value]="t.name"
                      (input)="onTeamNameInput(t.id, $any($event.target).value)"
                    />
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section class="card">
        <h2 class="section-title">Team 1 icon</h2>
        <p class="section-help">
          Upload a custom icon (PNG, JPEG, WebP, or SVG) for <code>team001</code> (Inglorious Basterds). Raster images are shown at the same display size as the default icon; SVG scales with CSS.
        </p>
        <div class="team-icon-settings-row">
          @if (team001CustomIconUrl()) {
            <img [src]="team001CustomIconUrl()!" alt="Team 1 custom icon preview" class="team-icon-preview" />
          } @else {
            <span class="material-symbols-outlined team-icon-preview team-icon-preview--fallback" aria-hidden="true">image</span>
          }
          <div class="team-icon-settings-actions">
            <input
              #team001IconInput
              type="file"
              class="team-icon-file-input"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg"
              (change)="onTeam001IconSelected($event)"
            />
            <button type="button" class="btn-secondary" [disabled]="team001IconUploading()" (click)="openTeam001IconPicker()">
              {{ team001IconUploading() ? 'Uploading…' : 'Upload image' }}
            </button>
            <button
              type="button"
              class="btn-secondary"
              [disabled]="team001IconUploading() || !team001CustomIconUrl()"
              (click)="removeTeam001Icon()"
            >
              Remove custom icon
            </button>
          </div>
        </div>
      </section>

      <section class="card">
        <h2 class="section-title">Test data</h2>
        <p class="section-help">Reset the database and reseed demo data with these current settings.</p>
        <button type="button" class="btn-secondary" [disabled]="resetting()" (click)="resetTestData()">
          {{ resetting() ? 'Resetting…' : 'Reset test data' }}
        </button>
      </section>

      @if (saveError()) {
        <p class="banner-error">{{ saveError() }}</p>
      }

      <div class="actions">
        <button
          type="button"
          class="btn-primary"
          [disabled]="saving()"
          (click)="save($event)"
        >
          {{ saving() ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .demo-settings-page {
        max-width: 900px;
        margin: 0 auto;
        padding: 40px 24px 64px;
      }
      .page-head {
        position: sticky;
        top: 0;
        z-index: 20;
        margin-bottom: 28px;
        padding: 8px 0 12px;
        background: var(--m3-surface);
        border-bottom: 1px solid var(--m3-outline-variant);
      }
      .back-link {
        display: inline-block;
        margin-bottom: 12px;
        font-weight: 600;
        color: var(--app-primary);
        text-decoration: none;
      }
      .back-link:hover {
        text-decoration: underline;
      }
      .page-title {
        margin: 0 0 8px;
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--m3-on-surface);
      }
      .page-lead {
        margin: 0;
        color: var(--m3-on-surface-variant);
        line-height: 1.5;
        font-size: 0.9375rem;
      }
      .page-lead code {
        font-size: 0.8125rem;
        word-break: break-all;
      }
      .banner-error {
        padding: 12px 14px;
        border-radius: var(--m3-shape-small);
        background: var(--m3-error-container);
        color: var(--m3-on-error-container);
        font-weight: 600;
        margin-bottom: 16px;
      }
      .card {
        margin-bottom: 20px;
        padding: 18px 20px;
        border-radius: var(--m3-shape-medium);
        border: 1px solid var(--m3-outline-variant);
        background: var(--m3-surface-container-low);
      }
      .section-title {
        margin: 0 0 14px;
        font-size: 1rem;
        font-weight: 700;
        color: var(--m3-on-surface);
      }
      .section-help {
        margin: 0 0 12px;
        color: var(--m3-on-surface-variant);
        font-size: 0.9rem;
      }
      .section-actions {
        margin-top: 12px;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .field-label {
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--m3-on-surface-variant);
      }
      .field-input {
        padding: 10px 12px;
        border-radius: var(--m3-shape-small);
        border: 1px solid var(--m3-outline-variant);
        background: var(--m3-surface);
        color: var(--m3-on-surface);
        font-family: inherit;
        font-size: 0.9375rem;
      }
      .field-input:focus {
        outline: 2px solid var(--app-primary);
        outline-offset: 0;
      }
      .field-input--table {
        width: 100%;
        box-sizing: border-box;
      }
      .check-row {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        cursor: pointer;
        color: var(--m3-on-surface);
      }
      .check-row input {
        width: 18px;
        height: 18px;
        accent-color: var(--app-primary);
      }
      .table-wrap {
        overflow-x: auto;
      }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9375rem;
      }
      .data-table th,
      .data-table td {
        padding: 8px 10px;
        border-bottom: 1px solid var(--m3-outline-variant);
        text-align: left;
        vertical-align: middle;
      }
      .data-table th {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--m3-on-surface-variant);
      }
      .cell-muted {
        width: 48px;
        color: var(--m3-on-surface-variant);
        font-variant-numeric: tabular-nums;
      }
      .cell-note {
        width: 1%;
        white-space: nowrap;
        vertical-align: middle;
      }
      .org-default-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: var(--m3-shape-small);
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        background: var(--m3-primary-container);
        color: var(--m3-on-primary-container);
      }
      .cell-id {
        font-family: ui-monospace, monospace;
        font-size: 0.8125rem;
        color: var(--m3-on-surface-variant);
        max-width: 220px;
        word-break: break-all;
      }
      .actions {
        margin-top: 8px;
      }
      .team-icon-settings-row {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .team-icon-settings-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .team-icon-file-input {
        display: none;
      }
      .team-icon-preview {
        width: 48px;
        height: 48px;
        object-fit: contain;
        border-radius: var(--m3-shape-small);
        border: 1px solid var(--m3-outline-variant);
        background: var(--m3-surface);
        color: var(--app-primary);
        flex-shrink: 0;
      }
      .team-icon-preview--fallback {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
      }
      .btn-primary {
        padding: 12px 24px;
        font-family: inherit;
        font-size: 0.9375rem;
        font-weight: 600;
        border: none;
        border-radius: var(--m3-shape-small);
        background: var(--app-primary);
        color: var(--app-on-primary);
        cursor: pointer;
      }
      .btn-primary:hover:not(:disabled) {
        opacity: 0.92;
      }
      .btn-primary:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }
      .btn-secondary {
        padding: 10px 20px;
        font-family: inherit;
        font-size: 0.9375rem;
        font-weight: 600;
        border: 1px solid var(--m3-outline-variant);
        border-radius: var(--m3-shape-small);
        background: var(--m3-surface-container-high);
        color: var(--m3-on-surface);
        cursor: pointer;
      }
      .btn-secondary:hover:not(:disabled) {
        background: var(--m3-surface-container);
        border-color: var(--app-primary);
      }
      .btn-secondary:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }
    `,
  ],
})
export class DemoSettingsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly demoSettings = inject(DemoVersionSettingsService);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild('team001IconInput')
  team001IconInput?: ElementRef<HTMLInputElement>;

  readonly appDisplayName = signal('');
  readonly includingMinutes = signal(false);
  readonly team001CustomIconUrl = signal<string | null>(null);
  readonly orgNames = signal<string[]>([]);
  readonly teams = signal<{ id: string; name: string }[]>([]);

  readonly saving = signal(false);
  readonly resetting = signal(false);
  readonly team001IconUploading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);

  ngOnInit(): void {
    this.http.get<DemoSettingsDto>('/api/demo-settings').subscribe({
      next: (d) => this.hydrate(d),
      error: () => this.loadError.set('Could not load demo settings.'),
    });
  }

  private hydrate(d: DemoSettingsDto): void {
    this.loadError.set(null);
    this.appDisplayName.set(d.appDisplayName);
    this.includingMinutes.set(d.includingMinutes);
    this.team001CustomIconUrl.set(
      d.team001CustomIconUrl ? resolveUnderAppBase(d.team001CustomIconUrl) : null,
    );
    this.orgNames.set([...d.organisationNames]);
    this.teams.set(d.teams.map((t) => ({ ...t })));
  }

  openTeam001IconPicker(): void {
    this.team001IconInput?.nativeElement.click();
  }

  onTeam001IconSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file || this.team001IconUploading()) {
      if (input) input.value = '';
      return;
    }

    this.team001IconUploading.set(true);
    this.saveError.set(null);
    const form = new FormData();
    form.append('file', file);
    this.http.post('/api/demo-settings/team-icon/team001', form).subscribe({
      next: () => {
        this.team001IconUploading.set(false);
        if (input) input.value = '';
        this.reloadDemoSettings();
        this.snackBar.open('Team 1 icon updated.', 'Dismiss', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      },
      error: (err) => {
        this.team001IconUploading.set(false);
        if (input) input.value = '';
        const msg = err?.error?.error ?? 'Icon upload failed.';
        this.saveError.set(typeof msg === 'string' ? msg : 'Icon upload failed.');
      },
    });
  }

  removeTeam001Icon(): void {
    if (this.team001IconUploading() || !this.team001CustomIconUrl()) return;
    this.team001IconUploading.set(true);
    this.saveError.set(null);
    this.http.delete('/api/demo-settings/team-icon/team001').subscribe({
      next: () => {
        this.team001IconUploading.set(false);
        this.reloadDemoSettings();
        this.snackBar.open('Team 1 icon removed.', 'Dismiss', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      },
      error: (err) => {
        this.team001IconUploading.set(false);
        const msg = err?.error?.error ?? 'Removing icon failed.';
        this.saveError.set(typeof msg === 'string' ? msg : 'Removing icon failed.');
      },
    });
  }

  onOrgNameInput(index: number, value: string): void {
    const next = [...this.orgNames()];
    next[index] = value;
    this.orgNames.set(next);
  }

  onTeamNameInput(id: string, value: string): void {
    this.teams.set(
      this.teams().map((t) => (t.id === id ? { ...t, name: value } : t)),
    );
  }

  save(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.saving()) return;
    this.saveError.set(null);
    this.saving.set(true);
    const body: DemoSettingsDto = {
      appDisplayName: this.appDisplayName().trim(),
      includingMinutes: this.includingMinutes(),
      organisationNames: this.orgNames().map((n) => n.trim()),
      teams: this.teams().map((t) => ({ id: t.id, name: t.name.trim() })),
    };
    this.http.put<DemoSettingsDto>('/api/demo-settings', body).subscribe({
      next: (d) => {
        this.demoSettings.applyDto(d);
        this.hydrate(d);
        this.saving.set(false);
        this.snackBar.open('Demo settings saved.', 'Dismiss', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.error ?? 'Save failed.';
        this.saveError.set(typeof msg === 'string' ? msg : 'Save failed.');
      },
    });
  }

  resetTestData(): void {
    if (this.resetting()) return;
    this.saveError.set(null);
    this.resetting.set(true);
    this.http.post('/api/seed/reset', {}).subscribe({
      next: () => {
        this.http.get<DemoSettingsDto>('/api/demo-settings').subscribe({
          next: (d) => {
            this.demoSettings.applyDto(d);
            this.hydrate(d);
            this.resetting.set(false);
          },
          error: () => {
            this.resetting.set(false);
            this.saveError.set('Reset succeeded, but reloading settings failed.');
          },
        });
      },
      error: () => {
        this.resetting.set(false);
        this.saveError.set('Failed to reset test data.');
      },
    });
  }

  private reloadDemoSettings(): void {
    this.http.get<DemoSettingsDto>('/api/demo-settings').subscribe({
      next: (d) => {
        this.demoSettings.applyDto(d);
        this.hydrate(d);
      },
      error: () => {
        this.saveError.set('Reloading demo settings failed.');
      },
    });
  }
}
