import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import type { Team } from '../teams';
import { DemoVersionSettingsService } from '../demo-version-settings.service';
import { resolveUnderAppBase } from '../core/app-base-url';

type Me = {
  guid: string;
  userName: string;
  displayName?: string | null;
  organisation?: string | null;
  isOnboarded: boolean;
  /** ISO string from API; null until first-login onboarding completes. */
  lastLoginAtUtc?: string | null;
};

type OrganisationDto = { id: number; name: string };

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatCardModule, RouterLink],
  template: `
    <div class="home">
      <header class="brand">
        <span class="brand-icon material-symbols-outlined" aria-hidden="true">forum</span>
        <h1 class="brand-name">{{ demoSettings.appDisplayName() }}</h1>
        <p class="brand-tagline">
          @if (me()?.lastLoginAtUtc) {
            Welcome {{ me()!.displayName }} from {{ me()!.organisation }}. Choose your team room.
          } @else {
            Choose your team room
          }
        </p>
      </header>
      @if (showOnboarding()) {
        <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="User onboarding">
          <div class="modal">
            <div class="modal-header">
              <h2 class="modal-title">User onboarding</h2>
              <p class="modal-subtitle">
                Welcome {{ me()?.userName }}. Before you continue, tell us who you are.
              </p>
            </div>
            <div class="modal-body">
              <div class="stepper" aria-label="Onboarding steps">
                <div class="step" [class.step--active]="onboardingStep() === 1">1. Intro</div>
                <div class="step" [class.step--active]="onboardingStep() === 2">2. Your profile</div>
              </div>

              @if (onboardingStep() === 1) {
                <p class="m3-body-medium">
                  {{ demoSettings.appDisplayName() }} is a lightweight demo app for working in teams. You can open any
                  team and browse meetings and topics. By default every user has read-only access to every team.
                </p>
                <p class="m3-body-medium">
                  Team admins can invite you as a team member. Membership expires after 6 months and needs to be
                  confirmed to extend it.
                </p>
                <p class="m3-body-medium">
                  Some teams can be set to “members-only”. In that case you won’t be able to open the team unless you
                  are a member.
                </p>
              } @else {
                <div class="form-row">
                  <div class="form-field">
                    <label class="form-label" for="displayName">Display name</label>
                    <input
                      id="displayName"
                      class="form-input"
                      type="text"
                      autocomplete="name"
                      required
                      [value]="displayName()"
                      (input)="displayName.set($any($event.target).value)"
                    />
                  </div>
                  <div class="form-field">
                    <label class="form-label" for="organisation">Organisation</label>
                    <input
                      id="organisation"
                      class="form-input"
                      type="text"
                      required
                      [value]="organisationName()"
                      (input)="organisationName.set($any($event.target).value)"
                    />
                  </div>
                </div>

                @if (onboardingError()) {
                  <p class="error">{{ onboardingError() }}</p>
                }
              }
            </div>
            <div class="modal-footer">
              <button type="button" class="btn" [disabled]="onboardingStep() === 1 || onboardingSaving()" (click)="prevOnboarding()">
                Back
              </button>
              @if (onboardingStep() === 1) {
                <button type="button" class="btn btn--primary" (click)="nextOnboarding()">Next</button>
              } @else {
                <button type="button" class="btn btn--primary" [disabled]="onboardingSaving()" (click)="saveOnboarding()">
                  {{ onboardingSaving() ? 'Saving…' : 'Finish' }}
                </button>
              }
            </div>
          </div>
        </div>
      }
      <div class="tiles">
        @if (loading()) {
          <p class="tiles-empty">Loading…</p>
        }
        @if (teams().length === 0 && !loading()) {
          @if (showOnboarding()) {
            <p class="tiles-empty">Complete user onboarding to continue.</p>
          } @else {
            <p class="tiles-empty">No teams yet. Reset test data to get started.</p>
          }
        }
        @if (!loading() && teams().length > 0) {
          @if (myTeams().length > 0) {
            <div class="tiles-section">
              <div class="tiles-section-title">Your teams</div>
              <div class="tiles-grid">
                @for (team of myTeams(); track team.id) {
                  <button
                    type="button"
                    class="tile"
                    (click)="onTeamClick(team)"
                  >
                    @if (isImageIcon(team.icon)) {
                      <img [src]="teamIconSrc(team.icon)" [alt]="team.name + ' icon'" class="tile-icon tile-icon--image" />
                    } @else {
                      <span class="material-symbols-outlined tile-icon" aria-hidden="true">{{ team.icon }}</span>
                    }
                    <span class="tile-name">{{ team.name }}</span>
                    @if (team.access === 'Admin') {
                      <span class="tile-badge tile-badge--admin">Admin</span>
                    } @else if (team.access === 'Member') {
                      <span class="tile-badge tile-badge--member">Member</span>
                    }
                  </button>
                }
              </div>
            </div>
          }

          @if (otherTeams().length > 0) {
            <div class="tiles-section">
              <div class="tiles-section-title">Other teams</div>
              <div class="tiles-grid">
                @for (team of otherTeams(); track team.id) {
                  <button
                    type="button"
                    class="tile"
                    [class.tile--members-only-no-access]="team.access === 'MembersOnlyNoAccess'"
                    [attr.aria-disabled]="team.access === 'MembersOnlyNoAccess'"
                    [disabled]="team.access === 'MembersOnlyNoAccess'"
                    (click)="team.access !== 'MembersOnlyNoAccess' && onTeamClick(team)"
                  >
                    @if (isImageIcon(team.icon)) {
                      <img [src]="teamIconSrc(team.icon)" [alt]="team.name + ' icon'" class="tile-icon tile-icon--image" />
                    } @else {
                      <span class="material-symbols-outlined tile-icon" aria-hidden="true">{{ team.icon }}</span>
                    }
                    <span class="tile-name">{{ team.name }}</span>
                    @if (team.access === 'MembersOnlyNoAccess') {
                      <span class="tile-badge">Members only</span>
                    }
                  </button>
                }
              </div>
            </div>
          }
        }
      </div>
      <div class="home-bottom-bar" aria-label="Account and demo settings">
        @if (!showOnboarding()) {
          <button type="button" class="home-corner-btn home-corner-btn--primary" (click)="startProfileSetup()">
            <span class="material-symbols-outlined home-corner-icon" aria-hidden="true">person</span>
            Simulate first login
          </button>
        }
        <a routerLink="/demo-settings" class="home-corner-link">
          <span class="material-symbols-outlined home-corner-icon" aria-hidden="true">settings</span>
          Demo settings
        </a>
      </div>
    </div>
  `,
  styles: [`
    .home {
      max-width: 900px;
      margin: 0 auto;
      padding: 48px 24px;
      padding-bottom: 120px;
    }
    .home-bottom-bar {
      position: fixed;
      left: 20px;
      bottom: 20px;
      z-index: 50;
      display: inline-flex;
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }
    .home-corner-icon {
      font-size: 20px;
      line-height: 1;
      flex-shrink: 0;
    }
    .home-corner-btn {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
      padding: 10px 16px;
      width: 100%;
      box-sizing: border-box;
      font-family: inherit;
      font-size: 0.9375rem;
      font-weight: 600;
      border-radius: var(--m3-shape-small);
      border: 1px solid transparent;
      cursor: pointer;
      box-shadow: var(--m3-elevation-2);
    }
    .home-corner-btn--primary {
      background: var(--app-primary);
      color: var(--app-on-primary);
    }
    .home-corner-btn--primary:hover {
      filter: brightness(1.05);
    }
    .home-corner-link {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
      padding: 10px 16px;
      width: 100%;
      box-sizing: border-box;
      font-family: inherit;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--m3-on-surface);
      background: var(--m3-surface-container-high);
      border: 1px solid var(--m3-outline-variant);
      border-radius: var(--m3-shape-small);
      text-decoration: none;
      cursor: pointer;
      box-shadow: var(--m3-elevation-1);
    }
    .home-corner-link:hover {
      background: var(--m3-surface-container);
      border-color: var(--app-primary);
    }
    .brand {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 32px;
      border-bottom: 2px solid var(--app-primary);
    }
    .brand-icon {
      display: block;
      font-size: 48px;
      color: var(--app-primary);
      margin-bottom: 8px;
    }
    .brand-name {
      font-size: 2.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0;
      color: var(--m3-on-surface);
      line-height: 1.1;
    }
    .brand-tagline {
      font-size: 1.125rem;
      font-weight: 500;
      color: var(--m3-on-surface-variant);
      margin: 12px 0 0;
    }
    .tiles {
      display: grid;
      grid-template-columns: 1fr;
      gap: 52px 18px;
    }
    .tiles-section {
      display: grid;
      gap: 12px;
    }
    .tiles-section-title {
      font-size: 0.8125rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--m3-on-surface-variant);
      padding: 0 4px;
    }
    .tiles-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
    }
    .tiles-empty {
      grid-column: 1 / -1;
      text-align: center;
      color: var(--m3-on-surface-variant);
      font-size: 1rem;
      margin: 0;
      padding: 24px;
    }
    .tile {
      cursor: pointer;
      padding: 24px 20px;
      min-height: 80px;
      border: 1px solid var(--m3-outline-variant);
      border-radius: var(--m3-shape-medium);
      background: var(--m3-surface-container-low);
      color: var(--m3-on-surface);
      font-family: inherit;
      font-size: 1rem;
      font-weight: 500;
      text-align: center;
      transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: var(--m3-elevation-1);
    }
    .tile:hover {
      background: var(--m3-surface-container);
      border-color: var(--app-primary);
      box-shadow: var(--m3-elevation-2);
    }
    .tile-icon {
      font-size: 32px;
      color: var(--app-primary);
    }
    .tile-icon--image {
      width: 32px;
      height: 32px;
      object-fit: contain;
      display: block;
    }
    .tile:focus-visible {
      outline: 2px solid var(--app-primary);
      outline-offset: 2px;
    }
    .tile--members-only-no-access {
      cursor: not-allowed;
      opacity: 0.7;
      background: var(--m3-surface-container-high);
      color: var(--m3-on-surface-variant);
      border-style: dashed;
      border-color: var(--m3-outline);
      box-shadow: none;
      pointer-events: auto;
    }
    .tile--members-only-no-access:hover {
      background: var(--m3-surface-container-high);
      border-color: var(--m3-outline);
      box-shadow: none;
    }
    .tile-badge {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--m3-outline);
      margin-top: 2px;
    }
    .tile-badge--admin {
      color: var(--app-primary);
    }
    .tile-badge--member {
      color: var(--m3-tertiary);
    }
    .tile-name {
      display: block;
      line-height: 1.25;
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      z-index: 1000;
    }
    .modal {
      width: 100%;
      max-width: 720px;
      border-radius: var(--m3-shape-large);
      background: var(--m3-surface);
      color: var(--m3-on-surface);
      box-shadow: var(--m3-elevation-4);
      border: 1px solid var(--m3-outline-variant);
    }
    .modal-header {
      padding: 20px 24px 12px;
      border-bottom: 1px solid var(--m3-outline-variant);
    }
    .modal-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
    }
    .modal-subtitle {
      margin: 6px 0 0;
      color: var(--m3-on-surface-variant);
    }
    .modal-body {
      padding: 16px 24px 8px;
    }
    .stepper {
      display: flex;
      gap: 12px;
      margin: 12px 0 16px;
    }
    .step {
      flex: 1;
      padding: 10px 12px;
      border-radius: var(--m3-shape-small);
      border: 1px solid var(--m3-outline-variant);
      background: var(--m3-surface-container-low);
      font-weight: 600;
      color: var(--m3-on-surface-variant);
      text-align: center;
    }
    .step--active {
      border-color: var(--app-primary);
      color: var(--m3-on-surface);
      background: var(--m3-primary-container);
    }
    .modal-footer {
      padding: 12px 24px 20px;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      border-top: 1px solid var(--m3-outline-variant);
    }
    .btn {
      padding: 10px 16px;
      font-family: inherit;
      font-size: 0.9375rem;
      font-weight: 600;
      border-radius: var(--m3-shape-small);
      border: 1px solid var(--m3-outline-variant);
      background: var(--m3-surface-container-low);
      color: var(--m3-on-surface);
      cursor: pointer;
    }
    .btn--primary {
      border-color: transparent;
      background: var(--app-primary);
      color: var(--app-on-primary);
    }
    .btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin: 12px 0;
    }
    .form-label {
      font-weight: 600;
      color: var(--m3-on-surface-variant);
    }
    .form-input {
      padding: 10px 12px;
      border-radius: var(--m3-shape-small);
      border: 1px solid var(--m3-outline-variant);
      background: var(--m3-surface);
      color: var(--m3-on-surface);
      font-family: inherit;
    }
    .error {
      color: var(--m3-error);
      font-weight: 600;
      margin: 8px 0 0;
    }
  `],
})
export class HomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  readonly demoSettings = inject(DemoVersionSettingsService);
  readonly teams = signal<Team[]>([]);
  readonly myTeams = computed(() =>
    this.teams()
      .filter((t) => t.access === 'Admin' || t.access === 'Member')
      .slice()
      .sort((a, b) => {
        const rank = (t: Team) => (t.access === 'Admin' ? 0 : 1);
        const r = rank(a) - rank(b);
        if (r !== 0) return r;
        return a.name.localeCompare(b.name);
      }),
  );
  readonly otherTeams = computed(() =>
    this.teams()
      .filter((t) => !(t.access === 'Admin' || t.access === 'Member'))
      .slice()
      .sort((a, b) => {
        const r = (a.isMembersOnly ? 1 : 0) - (b.isMembersOnly ? 1 : 0);
        if (r !== 0) return r;
        return a.name.localeCompare(b.name);
      }),
  );
  readonly loading = signal(true);
  readonly me = signal<Me | null>(null);
  readonly showOnboarding = signal(false);
  readonly onboardingStep = signal<1 | 2>(1);
  readonly displayName = signal('');
  readonly organisationName = signal('');
  readonly organisations = signal<OrganisationDto[]>([]);
  readonly onboardingError = signal<string | null>(null);
  readonly onboardingSaving = signal(false);

  ngOnInit(): void {
    this.loadMeAndTeams();
  }

  private needsFirstLoginOnboarding(me: Me): boolean {
    return me.lastLoginAtUtc == null || String(me.lastLoginAtUtc).trim() === '';
  }

  private openOnboardingWithUser(me: Me | null): void {
    this.onboardingError.set(null);
    this.displayName.set((me?.displayName ?? '').trim());
    this.organisationName.set((me?.organisation ?? '').trim());
    this.showOnboarding.set(true);
    this.onboardingStep.set(1);
    this.loadOrganisations();
  }

  loadMeAndTeams(): void {
    this.loading.set(true);
    this.http.get<Me>('/api/me').subscribe({
      next: (me) => {
        this.me.set(me);
        if (this.needsFirstLoginOnboarding(me)) {
          this.openOnboardingWithUser(me);
          this.teams.set([]);
          this.loading.set(false);
          return;
        }
        this.showOnboarding.set(false);
        this.loadTeams();
      },
      error: () => this.loading.set(false),
    });
  }

  loadOrganisations(): void {
    this.http.get<OrganisationDto[]>('/api/organisations').subscribe({
      next: (list) => {
        this.organisations.set(list);
        if (!this.organisationName().trim()) {
          this.organisationName.set((list[0]?.name ?? '').trim());
        }
      },
      error: () => this.organisations.set([]),
    });
  }

  startProfileSetup(): void {
    if (this.showOnboarding()) return;
    this.onboardingError.set(null);
    this.http.get<Me>('/api/me').subscribe({
      next: (me) => {
        this.me.set(me);
        this.displayName.set((me.displayName ?? '').trim());
        this.organisationName.set((me.organisation ?? '').trim());
        this.showOnboarding.set(true);
        this.onboardingStep.set(1);
        this.loadOrganisations();
      },
      error: () => undefined,
    });
  }

  loadTeams(): void {
    this.http.get<Team[]>('/api/teams').subscribe({
      next: (list) => {
        this.teams.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onTeamClick(team: Team): void {
    if (team.access !== 'MembersOnlyNoAccess') {
      this.router.navigate(['/team', team.id]);
    }
  }

  isImageIcon(icon: string): boolean {
    return icon.includes('/');
  }

  teamIconSrc(icon: string): string {
    return this.isImageIcon(icon) ? resolveUnderAppBase(icon) : icon;
  }

  nextOnboarding(): void {
    this.onboardingError.set(null);
    const step = this.onboardingStep();
    if (step === 1) {
      this.onboardingStep.set(2);
      if (this.organisations().length === 0) this.loadOrganisations();
    }
  }

  prevOnboarding(): void {
    this.onboardingError.set(null);
    const step = this.onboardingStep();
    if (step === 2) {
      this.onboardingStep.set(1);
    }
  }

  saveOnboarding(): void {
    if (this.onboardingSaving()) return;
    this.onboardingError.set(null);

    const displayName = this.displayName().trim();
    const organisation = this.organisationName().trim();
    if (!displayName || !organisation) {
      this.onboardingError.set('Display name and organisation are required.');
      return;
    }

    this.onboardingSaving.set(true);
    this.http.put<Me>('/api/me/onboarding', { displayName, organisation }).subscribe({
      next: () => {
        this.onboardingSaving.set(false);
        this.showOnboarding.set(false);
        this.loadMeAndTeams();
      },
      error: (err) => {
        this.onboardingSaving.set(false);
        const msg = err?.error?.error || 'Failed to save onboarding info.';
        this.onboardingError.set(msg);
      },
    });
  }
}
