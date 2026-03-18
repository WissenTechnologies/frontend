import { Injectable, inject } from '@angular/core';

import { LocalStorageService } from './local-storage.service';

export type ThemeMode = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(LocalStorageService);

  private readonly storageKey = 'THEME_MODE';
  private readonly darkClass = 'theme-dark';
  private readonly lightClass = 'theme-light';

  init() {
    const stored = this.storage.getItem(this.storageKey) as ThemeMode | null;
    const mode: ThemeMode = stored === 'light' || stored === 'dark' ? stored : 'dark';
    this.apply(mode);
  }

  getMode(): ThemeMode {
    const stored = this.storage.getItem(this.storageKey) as ThemeMode | null;
    return stored === 'light' ? 'light' : 'dark';
  }

  toggle() {
    const next: ThemeMode = this.getMode() === 'dark' ? 'light' : 'dark';
    this.apply(next);
  }

  private apply(mode: ThemeMode) {
    this.storage.setItem(this.storageKey, mode);

    document.body.classList.remove(this.darkClass);
    document.body.classList.remove(this.lightClass);

    document.body.classList.add(mode === 'dark' ? this.darkClass : this.lightClass);
  }
}
