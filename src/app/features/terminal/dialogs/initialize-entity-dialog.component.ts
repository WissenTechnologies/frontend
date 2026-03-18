import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-initialize-entity-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  template: `
    <div class="dialog-container bg-[#0a0a0a] text-white p-12 flex flex-col shadow-2xl">
      <div class="flex justify-between items-center mb-10">
        <h2 class="text-3xl font-bold tracking-[0.1em] uppercase italic">INITIALIZE ENTITY</h2>
        <button (click)="close()" class="text-gray-500 hover:text-white transition-colors">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p class="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-12">Register new company entity</p>

      <form [formGroup]="entityForm" (ngSubmit)="onSubmit()" class="space-y-8 flex-1">
        <div class="field-group border-b border-gray-800 pb-2 relative">
          <label class="block text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-2">NAME</label>
          <input formControlName="name" type="text" 
                 class="w-full bg-transparent text-white text-sm outline-none placeholder-gray-600"
                 placeholder="Enter full company name">

          @if (showSuggestions && suggestions.length > 0) {
            <div class="absolute left-0 right-0 mt-3 bg-[#0f0f0f] border border-gray-800 shadow-2xl z-50 max-h-56 overflow-auto">
              @for (s of suggestions; track s.domain) {
                <button type="button" (click)="selectSuggestion(s)" class="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3">
                  <img [src]="s.faviconUrl" class="h-6 w-6 rounded" (error)="$event.target.style.display='none'" />
                  <div class="flex flex-col">
                    <span class="text-sm font-semibold text-white">{{ s.name }}</span>
                    <span class="text-[10px] tracking-widest text-gray-500">{{ s.domain }}</span>
                  </div>
                </button>
              }
            </div>
          }
        </div>

        <div class="field-group border-b border-gray-800 pb-2">
          <label class="block text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-2">TICKER</label>
          <input formControlName="ticker" type="text" 
                 class="w-full bg-transparent text-white text-sm outline-none placeholder-gray-600 uppercase"
                 placeholder="e.g. AAPL">
        </div>

        <div class="field-group border-b border-gray-800 pb-2">
          <label class="block text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-2">SECTOR</label>
          <mat-select formControlName="sector" class="w-full" panelClass="premium-select-panel">
            @for (s of sectors; track s) {
              <mat-option [value]="s">{{ s }}</mat-option>
            }
          </mat-select>
        </div>

        <div class="field-group border-b border-gray-800 pb-2">
          <label class="block text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-2">WEBSITE</label>
          <input formControlName="website" type="text" 
                 class="w-full bg-transparent text-white text-sm outline-none placeholder-gray-600"
                 placeholder="e.g. google.com">
        </div>

        <div class="field-group border-b border-gray-800 pb-2">
          <label class="block text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-2">MARKET CAP</label>
          <input formControlName="marketCap" type="text" 
                 class="w-full bg-transparent text-white text-sm outline-none placeholder-gray-600"
                 placeholder="e.g. 2.98T">
        </div>

        <div class="field-group border-b border-gray-800 pb-2">
          <label class="block text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-2">SHARE PRICE</label>
          <input formControlName="price" type="number" 
                 class="w-full bg-transparent text-white text-sm outline-none placeholder-gray-600"
                 placeholder="0.00">
        </div>

        <div class="pt-12">
          <button type="submit" 
                  [disabled]="entityForm.invalid"
                  class="w-full bg-white text-black font-bold py-4 text-xs uppercase tracking-[0.3em] hover:bg-gray-200 transition-all disabled:opacity-20 translate-y-0 hover:-translate-y-1"
                  style="font-family: sans-serif-condensed, 'Roboto Condensed', 'Helvetica Neue Condensed', 'Arial Narrow', sans-serif;">
            REGISTER ENTITY
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  `]
})
export class InitializeEntityDialogComponent {
  private readonly destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<InitializeEntityDialogComponent>);
  private readonly http = inject(HttpClient);
  protected readonly data = inject<{ existingTickers?: string[]; existingSectors?: string[] }>(MAT_DIALOG_DATA, { optional: true });

  protected suggestions: Array<{ name: string; domain: string; logo?: string; faviconUrl?: string }> = [];
  protected showSuggestions = false;

  protected readonly sectors = [
    ...(this.data?.existingSectors ?? []),
    'Information Technology',
    'Financials',
    'Consumer Discretionary',
    'Communication Services',
    'Industrials',
    'Healthcare',
    'Energy',
    'Utilities',
    'Real Estate',
    'Materials',
    'Consumer Staples',
  ].filter((v, i, a) => !!v && a.indexOf(v) === i);

  readonly entityForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    ticker: new FormControl('', [Validators.required]),
    sector: new FormControl('', [Validators.required]),
    marketCap: new FormControl('', [Validators.required]),
    price: new FormControl('', [Validators.required]),
    website: new FormControl(''),
    logoUrl: new FormControl(''),
  });

  constructor() {
    const nameCtrl = this.entityForm.controls.name;

    nameCtrl.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(200),
        distinctUntilChanged(),
        switchMap(value => {
          const query = (value ?? '').toString().trim();
          if (query.length < 2) {
            // Defer view-affecting mutations to next macrotask to avoid NG0100 in dev mode.
            setTimeout(() => {
              this.showSuggestions = false;
              this.suggestions = [];
            }, 0);
            return of([]);
          }

          return this.http.get<Array<{ name: string; domain: string; logo?: string }>>(
            `${environment.apiUrl}/companies/suggest?query=${encodeURIComponent(query)}`
          );
        })
      )
      .subscribe(items => {
        // Defer view-affecting mutations to next macrotask to avoid NG0100 in dev mode.
        setTimeout(() => {
          const cleaned = (items ?? [])
            .filter(x => !!x && !!x.name && !!x.domain)
            .slice(0, 8)
            .map(x => ({
              ...x,
              faviconUrl: this.getFaviconUrl(x.domain),
            }));

          this.suggestions = cleaned;
          this.showSuggestions = this.suggestions.length > 0;
        }, 0);

        const tickerCtrl = this.entityForm.controls.ticker;
        const currentTicker = (tickerCtrl.value ?? '').toString().trim();
        if (!currentTicker) {
          const suggested = this.suggestUniqueTicker((nameCtrl.value ?? '').toString());
          if (suggested) {
            tickerCtrl.setValue(suggested, { emitEvent: false });
          }
        }
      });

    nameCtrl.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(150),
        distinctUntilChanged(),
        filter(() => !this.showSuggestions)
      )
      .subscribe(value => {
        const tickerCtrl = this.entityForm.controls.ticker;
        const currentTicker = (tickerCtrl.value ?? '').toString().trim();
        if (!currentTicker) {
          const suggested = this.suggestUniqueTicker((value ?? '').toString());
          if (suggested) {
            tickerCtrl.setValue(suggested, { emitEvent: false });
          }
        }
      });
  }

  protected selectSuggestion(s: { name: string; domain: string; logo?: string }) {
    // Defer to next macrotask to avoid NG0100 in dev mode.
    setTimeout(() => {
      this.showSuggestions = false;
      this.suggestions = [];
    }, 0);

    this.entityForm.controls.name.setValue(s.name, { emitEvent: false });
    this.entityForm.controls.website.setValue(s.domain, { emitEvent: false });
    this.entityForm.controls.logoUrl.setValue(this.getFaviconUrl(s.domain), { emitEvent: false });

    const suggested = this.suggestUniqueTicker(s.name, s.domain);
    if (suggested) {
      this.entityForm.controls.ticker.setValue(suggested, { emitEvent: false });
    }
  }

  protected getFaviconUrl(domain: string) {
    const d = (domain ?? '').toString().replace(/^https?:\/\//, '').replace(/\/.+$/, '');
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=64`;
  }

  private suggestUniqueTicker(name: string, domain?: string): string {
    const existing = new Set(
      (this.data?.existingTickers ?? []).map(x => x.toString().toUpperCase())
    );

    const seed = (domain ?? name)
      .toString()
      .replace(/^https?:\/\//, '')
      .replace(/\..*$/, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();

    const base = (seed || 'CO').slice(0, 5);

    if (!existing.has(base)) return base;
    for (let i = 2; i < 100; i++) {
      const candidate = (base.slice(0, Math.max(1, 5 - String(i).length)) + i).toUpperCase();
      if (!existing.has(candidate)) return candidate;
    }

    return base;
  }

  onSubmit() {
    if (this.entityForm.valid) {
      this.dialogRef.close(this.entityForm.value);
    }
  }

  close() {
    this.dialogRef.close();
  }
}
