import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

type TeamDto = { id: string; name: string };

type TeamUsersAdminDto = {
  teamId: string;
  isMembersOnly: boolean;
  membersCanCreateMeetings: boolean;
  membersCanCreateTopics: boolean;
  canEdit: boolean;
  adminUserNames: string[];
  users: Array<{
    userGuid: string;
    userName: string;
    displayName?: string | null;
    organisation?: string | null;
    isAdmin?: boolean;
    isMember: boolean;
    memberUntilUtc?: string | null;
  }>;
};

@Component({
  selector: 'app-team-users',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      @if (showReadOnlySnackbar()) {
        <div class="snackbar" role="status" aria-live="polite">
          <span class="snackbar-text">Read-only access: you can view settings but can’t make changes.</span>
          <button type="button" class="snackbar-close" (click)="showReadOnlySnackbar.set(false)" aria-label="Dismiss">×</button>
        </div>
      }
      <header class="header">
        <a [routerLink]="['/team', teamId()]" class="back-link">
          <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          Back to team
        </a>
        <div class="title-row">
          <h1 class="title">{{ (teamName() || teamId()) + ' settings' }}</h1>
        </div>
      </header>

      @if (loading()) {
        <p class="muted">Loading…</p>
      } @else if (error()) {
        <p class="error">{{ error() }}</p>
      } @else {
        <section class="card">
          <div class="card-head">
            <h2 class="card-title">Access settings</h2>
            <label class="toggle toggle--below">
              <input type="checkbox" [disabled]="!(dto()?.canEdit ?? false)" [checked]="dto()?.isMembersOnly ?? false" (change)="toggleMembersOnly($any($event.target).checked)" />
              <span>Members-only</span>
            </label>
            @if (dto()?.isMembersOnly ?? false) {
              <div class="setting-hint">Only members can access the {{ teamName() || teamId() }} team room</div>
            } @else {
              <div class="setting-hint">Everyone can open {{ teamName() || teamId() }}</div>
            }
            <label class="toggle toggle--below">
              <input
                type="checkbox"
                [disabled]="!(dto()?.canEdit ?? false)"
                [checked]="dto()?.membersCanCreateMeetings ?? false"
                (change)="toggleMembersCanCreateMeetings($any($event.target).checked)"
              />
              <span>Members can add meetings</span>
            </label>
            @if (dto()?.membersCanCreateMeetings ?? false) {
              <div class="setting-hint">All team members can create new meetings</div>
            } @else {
              <div class="setting-hint">Only admins can create new meetings</div>
            }
            <label class="toggle toggle--below">
              <input
                type="checkbox"
                [disabled]="!(dto()?.canEdit ?? false)"
                [checked]="dto()?.membersCanCreateTopics ?? false"
                (change)="toggleMembersCanCreateTopics($any($event.target).checked)"
              />
              <span>Everyone can add topics</span>
            </label>
            @if (!(dto()?.membersCanCreateTopics ?? false)) {
              <div class="setting-hint">Only admins and team members can create new topics</div>
            }
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <h2 class="card-title">Users</h2>
              <p class="muted">All Roundtable users. Set team membership (expires after 6 months).</p>
            </div>
            <input class="search" type="search" placeholder="Search users" [value]="search()" (input)="search.set($any($event.target).value)" />
          </div>

          <div class="table">
            <div class="row row--head">
              <div>User name</div>
              <div>Display name</div>
              <div>Organisation</div>
              <div>Member</div>
              <div>Expires</div>
              <div></div>
            </div>
            @for (u of filteredUsers(); track u.userGuid) {
              <div
                class="row"
                [class.row--expired]="isExpired(u.memberUntilUtc, u.isMember)"
                [class.row--expiring]="!isExpired(u.memberUntilUtc, u.isMember) && isExpiringSoon(u.memberUntilUtc, u.isMember)"
              >
                <div class="user-name">{{ u.userName }}</div>
                <div>{{ u.displayName || '—' }}</div>
                <div>{{ u.organisation || '—' }}</div>
                <div>
                  @if (u.isAdmin || (dto()?.adminUserNames ?? []).includes(u.userName)) {
                    <span class="member-label member-label--admin">Admin</span>
                  } @else {
                    <label class="toggle">
                      <input type="checkbox" [disabled]="!(dto()?.canEdit ?? false)" [checked]="u.isMember" (change)="setMember(u.userGuid, $any($event.target).checked)" />
                      <span>{{ (u.isMember && !isExpired(u.memberUntilUtc, u.isMember)) ? 'Member' : ((dto()?.isMembersOnly ?? false) ? 'No access' : 'Read-only') }}</span>
                    </label>
                  }
                </div>
                <div>
                  @if (u.isAdmin || (dto()?.adminUserNames ?? []).includes(u.userName)) {
                    Never
                  } @else {
                    <div>{{ formatUtcDate(u.memberUntilUtc) }}</div>
                    @if (isExpired(u.memberUntilUtc, u.isMember)) {
                      <div class="expires-sub">Expired</div>
                    }
                  }
                </div>
                <div class="actions">
                  @if (!(u.isAdmin || (dto()?.adminUserNames ?? []).includes(u.userName))) {
                    @if (u.isMember) {
                      <button class="btn" type="button" [disabled]="!(dto()?.canEdit ?? false)" (click)="renew(u.userGuid)">Renew for 6 months</button>
                    }
                  }
                </div>
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; margin: 0 auto; padding: 24px; }
    .header { padding-bottom: 16px; border-bottom: 2px solid var(--app-primary); margin-bottom: 16px; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--app-primary); text-decoration: none; font-weight: 600; }
    .back-link:hover { text-decoration: underline; }
    .back-link .material-symbols-outlined { font-size: 20px; }
    .title-row { display: flex; align-items: baseline; gap: 12px; margin-top: 10px; }
    .title { margin: 0; font-size: 1.75rem; font-weight: 800; }
    .subtitle { color: var(--m3-on-surface-variant); font-weight: 600; }
    .card { background: var(--m3-surface); border: 1px solid var(--m3-outline-variant); border-radius: var(--m3-shape-medium); box-shadow: var(--m3-elevation-1); padding: 16px; margin: 16px 0; }
    .card-title { margin: 0 0 6px; font-size: 1.125rem; font-weight: 800; }
    .card-head { display: flex; flex-direction: column; gap: 8px; }
    .muted { margin: 0; color: var(--m3-on-surface-variant); }
    .small { font-size: 0.8125rem; }
    .setting-hint {
      margin-left: 28px;
      margin-top: -4px;
      font-size: 0.75rem;
      letter-spacing: 0.01em;
      color: color-mix(in srgb, var(--m3-on-surface-variant) 70%, transparent);
      font-weight: 600;
    }
    .error { margin: 0; color: var(--m3-error); font-weight: 700; }
    .toggle { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; color: var(--m3-on-surface); cursor: pointer; }
    .toggle input { width: 18px; height: 18px; accent-color: var(--app-primary); }
    .toggle--below { margin-top: 6px; }
    .search { padding: 10px 12px; border-radius: var(--m3-shape-small); border: 1px solid var(--m3-outline-variant); background: var(--m3-surface-container-low); color: var(--m3-on-surface); font-family: inherit; min-width: 240px; }
    .table { display: grid; gap: 8px; margin-top: 12px; }
    .row { display: grid; grid-template-columns: 1.2fr 1.2fr 1.5fr 1.5fr 1fr 1fr; gap: 12px; align-items: center; padding: 10px 8px; border-radius: var(--m3-shape-small); border: 1px solid var(--m3-outline-variant); background: var(--m3-surface-container-low); }
    .row--head { background: var(--m3-surface-container); font-weight: 900; color: var(--m3-on-surface-variant); }
    .row--expiring {
      border-color: color-mix(in srgb, #f59e0b 65%, var(--m3-outline-variant));
      background: color-mix(in srgb, #f59e0b 10%, var(--m3-surface-container-low));
    }
    .row--expired {
      border-color: color-mix(in srgb, var(--m3-error) 65%, var(--m3-outline-variant));
      background: color-mix(in srgb, var(--m3-error) 10%, var(--m3-surface-container-low));
    }
    .user-name { font-weight: 900; }
    .actions { display: flex; justify-content: flex-end; }
    .btn { padding: 8px 12px; border-radius: var(--m3-shape-small); border: 1px solid var(--m3-outline-variant); background: var(--m3-surface-container); color: var(--m3-on-surface); font-weight: 800; cursor: pointer; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .member-label { font-weight: 800; }
    .member-label--admin { color: var(--app-primary); }
    .expires-sub {
      margin-top: 2px;
      font-size: 0.75rem;
      color: var(--m3-error);
      font-weight: 700;
    }
    .snackbar {
      position: fixed;
      left: 50%;
      bottom: 20px;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: min(720px, calc(100vw - 32px));
      padding: 12px 14px;
      border-radius: var(--m3-shape-medium);
      border: 1px solid var(--m3-outline-variant);
      background: var(--m3-surface-container-high);
      color: var(--m3-on-surface);
      box-shadow: var(--m3-elevation-3);
      z-index: 1100;
    }
    .snackbar-text { font-weight: 700; }
    .snackbar-close {
      margin-left: auto;
      width: 32px;
      height: 32px;
      border-radius: var(--m3-shape-full);
      border: 1px solid var(--m3-outline-variant);
      background: transparent;
      color: var(--m3-on-surface-variant);
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
    }
    .snackbar-close:hover { background: color-mix(in srgb, var(--m3-on-surface) 8%, transparent); }
  `],
})
export class TeamUsersComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  readonly teamId = signal('');
  readonly teamName = signal('');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly dto = signal<TeamUsersAdminDto | null>(null);
  readonly search = signal('');
  readonly showReadOnlySnackbar = signal(false);

  readonly filteredUsers = computed(() => {
    const q = this.search().trim().toLowerCase();
    const users = this.dto()?.users ?? [];
    const filtered = !q
      ? users
      : users.filter((u) =>
          (u.userName ?? '').toLowerCase().includes(q) ||
          (u.displayName ?? '').toLowerCase().includes(q) ||
          (u.organisation ?? '').toLowerCase().includes(q),
        );

    const adminUserNames = new Set((this.dto()?.adminUserNames ?? []).map((x) => (x ?? '').toLowerCase()));

    return filtered.slice().sort((a, b) => {
      const adminA = a.isAdmin === true || adminUserNames.has((a.userName ?? '').toLowerCase());
      const adminB = b.isAdmin === true || adminUserNames.has((b.userName ?? '').toLowerCase());
      if (adminA !== adminB) return adminA ? -1 : 1;

      const memberA = a.isMember === true;
      const memberB = b.isMember === true;
      if (memberA !== memberB) return memberA ? -1 : 1;

      if (memberA && memberB) {
        const ta = this.sortableTimeUtc(a.memberUntilUtc);
        const tb = this.sortableTimeUtc(b.memberUntilUtc);
        if (ta !== tb) return ta - tb;
      }

      return (a.userName ?? '').localeCompare(b.userName ?? '');
    });
  });

  private sortableTimeUtc(iso?: string | null): number {
    if (!iso) return Number.POSITIVE_INFINITY;
    const d = new Date(iso);
    const t = d.getTime();
    return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
  }

  ngOnInit(): void {
    const teamId = this.route.snapshot.paramMap.get('teamId');
    if (!teamId) {
      this.router.navigate(['/']);
      return;
    }
    this.teamId.set(teamId);
    this.loadTeam();
    this.load();
  }

  loadTeam(): void {
    this.http.get<TeamDto>(`/api/teams/${encodeURIComponent(this.teamId())}`).subscribe({
      next: (t) => this.teamName.set(t.name),
      error: () => this.teamName.set(''),
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<TeamUsersAdminDto>(`/api/teams/${encodeURIComponent(this.teamId())}/users`).subscribe({
      next: (dto) => {
        this.dto.set(dto);
        if (!dto.canEdit) {
          this.showReadOnlySnackbar.set(true);
        }
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err?.status === 403 ? 'You are not an admin for this team.' : 'Failed to load users.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  setMember(userGuid: string, isMember: boolean): void {
    this.http.put(`/api/teams/${encodeURIComponent(this.teamId())}/users/${encodeURIComponent(userGuid)}`, { isMember }).subscribe({
      next: () => this.load(),
      error: () => this.load(),
    });
  }

  renew(userGuid: string): void {
    this.http.post(`/api/teams/${encodeURIComponent(this.teamId())}/users/${encodeURIComponent(userGuid)}/renew`, {}).subscribe({
      next: () => this.load(),
      error: () => this.load(),
    });
  }

  toggleMembersOnly(isMembersOnly: boolean): void {
    this.http.put(`/api/teams/${encodeURIComponent(this.teamId())}/members-only`, { isMembersOnly }).subscribe({
      next: () => this.load(),
      error: () => this.load(),
    });
  }

  toggleMembersCanCreateMeetings(enabled: boolean): void {
    this.http.put(`/api/teams/${encodeURIComponent(this.teamId())}/members-can-create-meetings`, { enabled }).subscribe({
      next: () => this.load(),
      error: () => this.load(),
    });
  }

  toggleMembersCanCreateTopics(enabled: boolean): void {
    this.http.put(`/api/teams/${encodeURIComponent(this.teamId())}/members-can-create-topics`, { enabled }).subscribe({
      next: () => this.load(),
      error: () => this.load(),
    });
  }

  formatUtcDate(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
  }

  isExpiringSoon(iso?: string | null, isMember?: boolean): boolean {
    if (!isMember) return false;
    if (!iso) return false;
    const exp = new Date(iso);
    if (Number.isNaN(exp.getTime())) return false;
    const now = new Date();
    if (exp.getTime() < now.getTime()) return false; // already expired
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return exp.getTime() <= in30.getTime();
  }

  isExpired(iso?: string | null, isMember?: boolean): boolean {
    if (!isMember) return false;
    if (!iso) return false;
    const exp = new Date(iso);
    if (Number.isNaN(exp.getTime())) return false;
    return exp.getTime() < new Date().getTime();
  }
}

