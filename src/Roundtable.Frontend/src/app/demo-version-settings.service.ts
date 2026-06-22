import { inject, Injectable, signal, type WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type DemoSettingsDto = {
  appDisplayName: string;
  includingMinutes: boolean;
  team001CustomIconUrl?: string | null;
  organisationNames: string[];
  teams: { id: string; name: string }[];
};

@Injectable({ providedIn: 'root' })
export class DemoVersionSettingsService {
  private readonly http = inject(HttpClient);

  /**
   * Demo toggle: when disabled, we hide/skip Minutes UI so the app can be demoed
   * without the Minutes feature.
   */
  readonly includingMinutes: WritableSignal<boolean> = signal(false);

  /** Shown on the home page brand heading. */
  readonly appDisplayName = signal('Roundtable');

  loadFromServer(): Promise<void> {
    return firstValueFrom(this.http.get<DemoSettingsDto>('/api/demo-settings')).then(
      (d) => this.applyDto(d),
      () => undefined,
    );
  }

  applyDto(d: DemoSettingsDto): void {
    this.appDisplayName.set(d.appDisplayName);
    this.includingMinutes.set(d.includingMinutes);
  }
}
