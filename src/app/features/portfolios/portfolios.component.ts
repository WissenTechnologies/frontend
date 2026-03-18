import { Component, inject, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { AUTH_FACADE } from '../../auth/tokens';
import { PortfolioDialogComponent } from './dialogs/portfolio-dialog.component';
import { PortfolioApiService, Portfolio, Holding } from '../../core/services/portfolio-api.service';
import { StockApiService, Stock } from '../../core/services/stock-api.service';
import { CompaniesApiService, Company } from '../../core/services/companies-api.service';
import { forkJoin, map, switchMap, of, interval, Subscription, BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

interface EnrichedHolding extends Holding {
  name: string;
  currentPrice: number;
  gainLoss: number;
  gainLossPercent: number;
  logoUrl?: string;
}

interface EnrichedPortfolio extends Omit<Portfolio, 'holdings'> {
  holdings: EnrichedHolding[];
}

@Component({
  selector: 'app-portfolios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatTabsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    FormsModule
  ],
  template: `
    <div class="portfolio-container p-10">
      <header class="mb-12 flex justify-between items-end">
        <div>
          <span class="text-[8px] font-bold text-white opacity-40 uppercase tracking-[0.4em]">USER WEALTH MANAGEMENT</span>
          <h1 class="text-3xl font-bold text-white mt-2 italic tracking-tight">Investment Portfolios</h1>
        </div>
        <button (click)="addPortfolio()" class="add-portfolio-btn">
          NEW PORTFOLIO
        </button>
      </header>

      <!-- SELECTOR AND SEARCH -->
      <div class="flex flex-wrap gap-6 items-center mb-10 pb-8 border-b border-gray-900">
        <div class="flex-1 max-w-sm">
          <label class="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1">SELECT PORTFOLIO</label>
          <mat-form-field appearance="outline" class="w-full premium-select">
            <mat-select [(value)]="selectedPortfolioId">
              @for (p of portfolios; track p.id) {
                <mat-option [value]="p.id">{{ p.name | uppercase }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="flex-1 max-w-sm">
          <label class="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1">SEARCH HOLDINGS</label>
          <div class="search-wrap">
            <input type="text" [(ngModel)]="holdingsSearchTerm" placeholder="FILTER ASSETS..." class="search-input">
          </div>
        </div>

        <div class="flex gap-4 self-end h-[48px]">
          <button (click)="editPortfolio()" class="icon-btn" title="Edit Portfolio">
            <mat-icon class="scale-75">edit</mat-icon>
          </button>
          <button (click)="deletePortfolio()" class="icon-btn text-red-900 hover:text-red-500" title="Delete Portfolio">
            <mat-icon class="scale-75">delete</mat-icon>
          </button>
        </div>
      </div>

      @if (selectedPortfolio; as portfolio) {
        <div class="tab-content">
          <!-- SUMMARY CARDS -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div class="stat-card">
              <label class="stat-label">TOTAL ASSETS</label>
              <p class="stat-value text-white">₹{{ calculateTotalValue(portfolio).toLocaleString() }}</p>
              <div class="stat-footer text-[10px] text-gray-600 mt-2 font-mono">NET LIQUIDATION VALUE</div>
            </div>
            
            <div class="stat-card">
              <label class="stat-label">UNREALIZED P/L</label>
              <p class="stat-value" [class.text-green-500]="calculateTotalGainLoss(portfolio) >= 0" [class.text-red-600]="calculateTotalGainLoss(portfolio) < 0">
                {{ calculateTotalGainLoss(portfolio) >= 0 ? '+' : '' }}₹{{ calculateTotalGainLoss(portfolio).toLocaleString() }}
              </p>
              <div class="stat-footer text-[10px] mt-2 font-mono" [class.text-green-900]="calculateTotalGainLoss(portfolio) >= 0" [class.text-red-900]="calculateTotalGainLoss(portfolio) < 0">
                PERFORMANCE METRIC: {{ (calculateTotalGainLoss(portfolio) / (calculateTotalValue(portfolio) - calculateTotalGainLoss(portfolio) || 1) * 100).toFixed(2) }}%
              </div>
            </div>

            <div class="stat-card">
              <label class="stat-label">AVAILABLE CAPITAL</label>
              <p class="stat-value text-white">₹{{ portfolio.availableCash.toLocaleString() }}</p>
              <div class="stat-footer text-[10px] text-gray-600 mt-2 font-mono">PURCHASING POWER</div>
            </div>
          </div>

          <!-- HOLDINGS TABLE -->
          <div class="holdings-section">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">CURRENT POSITIONS ({{ filteredHoldings(portfolio).length }})</h3>
              <span class="text-[10px] font-mono text-gray-600 italic">SYSTEM STATUS: LIVE FEED</span>
            </div>

            <div class="overflow-hidden border border-gray-900 rounded-sm bg-[#050505]">
              <table mat-table [dataSource]="filteredHoldings(portfolio)" class="premium-table">
                <ng-container matColumnDef="asset">
                  <th mat-header-cell *matHeaderCellDef> ASSET IDENTIFIER </th>
                  <td mat-cell *matCellDef="let h">
                    <div class="flex items-center gap-4 py-5">
                      @if (h.logoUrl) {
                        <img
                          class="company-logo"
                          [src]="h.logoUrl"
                          alt=""
                          (error)="$event.target.style.display='none'"
                        />
                      }
                      <div class="ticker-box">{{ h.symbol }}</div>
                      <div class="flex flex-col">
                        <span class="text-white font-bold text-sm">{{ h.name }}</span>
                        <span class="text-[10px] text-gray-600 uppercase tracking-widest">Equity Market</span>
                      </div>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="quantity">
                  <th mat-header-cell *matHeaderCellDef> POSITION SIZE </th>
                  <td mat-cell *matCellDef="let h" class="font-mono text-gray-400"> {{ h.quantity }} SHARES </td>
                </ng-container>

                <ng-container matColumnDef="avgPrice">
                  <th mat-header-cell *matHeaderCellDef> ACQUISITION PRICE </th>
                  <td mat-cell *matCellDef="let h" class="font-mono text-gray-400"> ₹{{ h.averagePrice.toLocaleString() }} </td>
                </ng-container>

                <ng-container matColumnDef="currentPrice">
                  <th mat-header-cell *matHeaderCellDef> MARKET PRICE </th>
                  <td mat-cell *matCellDef="let h" class="font-mono text-white"> ₹{{ h.currentPrice.toLocaleString() }} </td>
                </ng-container>

                <ng-container matColumnDef="gainLoss">
                  <th mat-header-cell *matHeaderCellDef> DELTA </th>
                  <td mat-cell *matCellDef="let h" [class.text-green-500]="h.gainLoss >= 0" [class.text-red-600]="h.gainLoss < 0" class="font-mono text-right pr-6">
                    <div class="flex flex-col">
                      <span>{{ h.gainLoss >= 0 ? '+' : '' }}₹{{ h.gainLoss.toLocaleString() }}</span>
                      <span class="text-[10px] opacity-60">[{{ h.gainLossPercent >= 0 ? '+' : '' }}{{ h.gainLossPercent.toFixed(2) }}%]</span>
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
              
              <div *ngIf="filteredHoldings(portfolio).length === 0" class="p-20 text-center">
                <p class="text-gray-700 uppercase tracking-widest text-xs font-bold">No assets found in this portfolio</p>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { 
      display: block; 
      background: var(--bg); 
      min-height: 100vh;
      font-family: 'Inter', sans-serif;
    }

    .add-portfolio-btn {
      background: #fff;
      color: #000;
      font-weight: 900;
      font-size: 11px;
      letter-spacing: 2px;
      padding: 12px 24px;
      border-radius: 2px;
      transition: all 0.2s;
      &:hover { background: #ccc; transform: translateY(-1px); }
    }

    .search-wrap {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 2px;
      padding: 11px 16px;
      .search-input {
        width: 100%;
        background: transparent;
        border: none;
        outline: none;
        color: var(--text);
        font-size: 11px;
        font-weight: bold;
        letter-spacing: 1px;
        &::placeholder { color: var(--text-muted); }
      }
    }

    .icon-btn {
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text-muted);
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 2px;
      transition: all 0.2s;
      &:hover { background: var(--surface); color: var(--text); }
    }

    ::ng-deep .premium-select {
      .mat-mdc-text-field-wrapper {
        background-color: var(--surface-2) !important;
        border: 1px solid var(--border) !important;
        border-radius: 2px !important;
        height: 48px !important;
      }
      .mat-mdc-form-field-infix {
        padding-top: 12px !important;
        padding-bottom: 0 !important;
      }
      .mat-mdc-select-value-text {
        color: var(--text) !important;
        font-weight: bold !important;
        font-size: 12px !important;
        letter-spacing: 1px !important;
      }
      .mat-mdc-form-field-subscript-wrapper { display: none; }
    }

    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 30px;
      position: relative;
      &::before {
        content: '';
        position: absolute;
        top: 0; left: 0; width: 100%; height: 2px;
        background: linear-gradient(90deg, transparent, var(--border), transparent);
      }
    }

    .stat-label {
      display: block; font-size: 10px; font-weight: 800; color: var(--text-muted);
      letter-spacing: 3px; margin-bottom: 12px;
    }

    .stat-value {
      font-size: 32px; font-weight: 900; letter-spacing: -1px;
    }

    .ticker-box {
      background: var(--surface-2); color: var(--text); padding: 4px 10px; font-family: monospace;
      font-size: 11px; font-weight: bold; border-radius: 2px; border: 1px solid var(--border);
    }

    .company-logo {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      object-fit: cover;
      border: 1px solid var(--border);
    }

    .premium-table {
      width: 100%; background: transparent !important;
      th {
        background: var(--surface-2) !important; color: var(--text-muted) !important; font-size: 10px !important;
        font-weight: 800 !important; letter-spacing: 2px !important; padding: 15px 24px !important;
        border-bottom: 1px solid var(--border) !important;
      }
      td { padding: 0 24px !important; border-bottom: 1px solid var(--border) !important; background: transparent !important; }
      tr:hover td { background: color-mix(in srgb, var(--text) 4%, transparent) !important; }
    }
  `]
})
export class PortfoliosComponent {
  private readonly authFacade = inject(AUTH_FACADE);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly portfolioApi = inject(PortfolioApiService);
  private readonly stockApi = inject(StockApiService);
  private readonly companiesApi = inject(CompaniesApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  
  portfolios: EnrichedPortfolio[] = [];
  stocks: Stock[] = [];
  private readonly companies = new Map<string, Company>();
  private readonly lastPricesBySymbol = new Map<string, number>();
  private stocksPollingSub?: Subscription;
  private readonly portfoliosSubject = new BehaviorSubject<EnrichedPortfolio[]>([]);
  readonly portfolios$ = this.portfoliosSubject.asObservable();

  private isAdmin = false;

  selectedPortfolioId: number | null = null;
  holdingsSearchTerm = '';

  displayedColumns: string[] = ['asset', 'quantity', 'avgPrice', 'currentPrice', 'gainLoss'];

  constructor() {
    this.authFacade.authUser$.pipe(take(1)).subscribe(user => {
      this.isAdmin = (user?.role?.toString().toLowerCase() === 'admin');
      this.initData();
      this.startRealTimeUpdates();
    });
  }

  private initData() {
    const portfolios$ = this.isAdmin
      ? this.portfolioApi.getAllPortfoliosAdmin()
      : this.portfolioApi.getPortfolios();

    forkJoin({
      portfolios: portfolios$,
      stocks: this.stockApi.getStocks(),
      companies: this.companiesApi.getCompanies()
    }).subscribe(({ portfolios, stocks, companies }) => {
      this.stocks = stocks;
      this.setupCompaniesRegistry(companies);
      this.portfolios = portfolios.map(p => this.enrichPortfolio(p, stocks));
      this.portfoliosSubject.next(this.portfolios);
      if (this.portfolios.length > 0 && !this.selectedPortfolioId) {
        setTimeout(() => {
          this.selectedPortfolioId = this.portfolios[0].id;
        }, 0);
      }
    });
  }

  private setupCompaniesRegistry(companies: Company[]) {
    this.companies.clear();
    for (const c of companies) {
      if (c?.ticker) {
        const ticker = c.ticker.toString().trim().toUpperCase();
        this.companies.set(ticker, c);
      }
    }
  }

  private enrichPortfolio(p: Portfolio, stocks: Stock[]): EnrichedPortfolio {
    const enrichedHoldings: EnrichedHolding[] = p.holdings.map(h => {
      const stock = stocks.find(s => s.symbol === h.symbol);
      const company = this.companies.get(h.symbol.toUpperCase());
      const currentPrice = stock ? stock.currentPrice : h.averagePrice;
      const gainLoss = (currentPrice - h.averagePrice) * h.quantity;
      const gainLossPercent = h.averagePrice > 0 ? ((currentPrice - h.averagePrice) / h.averagePrice) * 100 : 0;
      
      return {
        ...h,
        name: stock ? stock.name : (company?.name || h.symbol),
        currentPrice,
        gainLoss,
        gainLossPercent,
        logoUrl: company?.logoUrl
      };
    });

    return {
      ...p,
      holdings: enrichedHoldings
    };
  }

  get selectedPortfolio() {
    return this.portfolios.find(p => p.id === this.selectedPortfolioId);
  }

  filteredHoldings(p: EnrichedPortfolio) {
    if (!this.holdingsSearchTerm) return p.holdings;
    const term = this.holdingsSearchTerm.toLowerCase();
    return p.holdings.filter(h => 
      h.symbol.toLowerCase().includes(term) || 
      (h as any).name?.toLowerCase().includes(term)
    );
  }

  calculateTotalValue(p: EnrichedPortfolio): number {
    const holdingsValue = p.holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
    return holdingsValue + (p.availableCash || 0);
  }

  calculateTotalGainLoss(p: EnrichedPortfolio): number {
    return p.holdings.reduce((sum, h) => sum + h.gainLoss, 0);
  }

  ngOnDestroy() {
    if (this.stocksPollingSub) {
      this.stocksPollingSub.unsubscribe();
    }
  }

  private startRealTimeUpdates() {
    // Poll stocks every 1 second for real-time price updates
    this.stocksPollingSub = interval(1000).subscribe(() => {
      this.updateRealTimePrices();
    });
  }

  private updateRealTimePrices() {
    this.stockApi.getStocks().subscribe(stocks => {
      setTimeout(() => {
        const updatedPortfolios = this.portfolios.map(p => {
          const enrichedHoldings = p.holdings.map(h => {
            const stock = stocks.find(s => s.symbol === h.symbol);
            const company = this.companies.get(h.symbol.toUpperCase());
            const currentPrice = stock ? stock.currentPrice : h.currentPrice;
            const gainLoss = (currentPrice - h.averagePrice) * h.quantity;
            const gainLossPercent = h.averagePrice > 0 ? ((currentPrice - h.averagePrice) / h.averagePrice) * 100 : 0;
            
            return {
              ...h,
              name: stock ? stock.name : (company?.name || h.symbol),
              currentPrice,
              gainLoss,
              gainLossPercent,
              logoUrl: company?.logoUrl
            };
          });
          
          return {
            ...p,
            holdings: enrichedHoldings
          };
        });
        
        this.portfolios = updatedPortfolios;
        this.portfoliosSubject.next(updatedPortfolios);
        this.cdr.markForCheck();
      }, 0);
    });
  }

  // CRUD METHODS
  addPortfolio() {
    const dialogRef = this.dialog.open(PortfolioDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: {}
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.portfolioApi.createPortfolio(result.name, result.availableCash || 0).subscribe({
          next: (newP) => {
            // Defer state updates to avoid NG0100 in dev mode.
            setTimeout(() => {
              this.selectedPortfolioId = newP.id;
              this.initData();
              this.snackBar.open('Portfolio created', 'Close', { duration: 3000 });
            }, 0);
          },
          error: (err) => {
            const msg = err?.error ?? err?.message ?? 'Create failed';
            this.snackBar.open(String(msg), 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  editPortfolio() {
    const portfolio = this.selectedPortfolio;
    if (!portfolio) return;

    const dialogRef = this.dialog.open(PortfolioDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: { portfolio }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.portfolioApi.updatePortfolio(portfolio.id, result.name, result.availableCash).subscribe({
          next: () => {
            this.initData();
            this.snackBar.open('Portfolio updated', 'Close', { duration: 3000 });
          },
          error: (err) => {
            const msg = err?.error ?? err?.message ?? 'Update failed';
            this.snackBar.open(String(msg), 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  deletePortfolio() {
    const portfolio = this.selectedPortfolio;
    if (!portfolio || !portfolio.id) return;
    
    if (confirm(`Are you sure you want to delete ${portfolio.name}? All holdings will be removed.`)) {
      this.portfolioApi.deletePortfolio(portfolio.id).subscribe({
        next: () => {
          this.selectedPortfolioId = null;
          this.initData();
          this.snackBar.open('Portfolio deleted', 'Close', { duration: 3000 });
        },
        error: (err) => {
          const msg = err?.error ?? err?.message ?? 'Delete failed';
          this.snackBar.open(String(msg), 'Close', { duration: 5000 });
        }
      });
    }
  }
}
