import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { PortfolioApiService, Portfolio } from '../../core/services/portfolio-api.service';
import { StockApiService, Stock } from '../../core/services/stock-api.service';
import { CompaniesApiService, Company } from '../../core/services/companies-api.service';

export interface BalanceRow {
  portfolioId: number;
  portfolioName: string;
  symbol: string;
  companyName: string;
  companyLogoUrl?: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  costValue: number;
  marketValue: number;
  pnl: number;
  pnlPercent: number;
};

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
  ],
  template: `
    <div class="balance-container p-6">
      <header class="mb-8 flex justify-between items-end">
        <div>
          <span class="text-[8px] font-bold text-white opacity-40 uppercase tracking-[0.4em]">USER WEALTH MANAGEMENT</span>
          <h1 class="text-2xl font-bold text-white mt-1 italic tracking-tight">Holdings Overview</h1>
        </div>

        <div class="flex-1 max-w-sm">
          <label class="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1">SELECT PORTFOLIO</label>
          <mat-form-field appearance="outline" class="w-full premium-select">
            <mat-select [(value)]="selectedPortfolioId">
              <mat-option [value]="0">All Portfolios</mat-option>
              @for (p of portfolios; track p.id) {
                <mat-option [value]="p.id">{{ p.name | uppercase }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      </header>

      <!-- SUMMARY CARDS -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="stat-card">
          <label class="stat-label">TOTAL MARKET VALUE</label>
          <p class="stat-value text-white">₹{{ totalMarketValue.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</p>
          <div class="stat-footer text-[10px] text-gray-600 mt-2 font-mono">NET LIQUIDATION VALUE</div>
        </div>
        
        <div class="stat-card">
          <label class="stat-label">TOTAL COST</label>
          <p class="stat-value text-white">₹{{ totalCostValue.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</p>
          <div class="stat-footer text-[10px] text-gray-600 mt-2 font-mono">ACQUISITION COST</div>
        </div>

        <div class="stat-card">
          <label class="stat-label">UNREALIZED P/L</label>
          <p class="stat-value" [class.text-green-500]="totalPnl >= 0" [class.text-red-600]="totalPnl < 0">
            {{ totalPnl >= 0 ? '+' : '' }}₹{{ totalPnl.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}
          </p>
          <div class="stat-footer text-[10px] mt-2 font-mono" [class.text-green-900]="totalPnl >= 0" [class.text-red-900]="totalPnl < 0">
            PERFORMANCE METRIC: {{ totalCostValue ? ((totalPnl / totalCostValue) * 100).toFixed(2) : '0.00' }}%
          </div>
        </div>
      </div>

      <!-- HOLDINGS TABLE -->
      <div class="holdings-section">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">ALL HOLDINGS ({{ filteredRows.length }})</h3>
          <span class="text-[10px] font-mono text-gray-600 italic">SYSTEM STATUS: LIVE FEED</span>
        </div>

        <div class="overflow-hidden border border-gray-900 rounded-sm bg-[#050505]">
          <table mat-table [dataSource]="filteredRows" class="premium-table">
            <ng-container matColumnDef="portfolio">
              <th mat-header-cell *matHeaderCellDef> PORTFOLIO </th>
              <td mat-cell *matCellDef="let r" class="font-mono text-gray-400">{{ r.portfolioName | uppercase }}</td>
            </ng-container>

            <ng-container matColumnDef="asset">
              <th mat-header-cell *matHeaderCellDef> ASSET IDENTIFIER </th>
              <td mat-cell *matCellDef="let r">
                <div class="flex items-center gap-3 py-3">
                  @if (r.companyLogoUrl) {
                    <img
                      class="company-logo"
                      [src]="r.companyLogoUrl"
                      alt=""
                      (error)="$event.target.style.display='none'"
                    />
                  }
                  <div class="ticker-box">{{ r.symbol }}</div>
                  <div class="flex flex-col">
                    <span class="text-white font-bold text-sm">{{ r.companyName }}</span>
                    <span class="text-[10px] text-gray-600 uppercase tracking-widest">Equity Market</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef> POSITION SIZE </th>
              <td mat-cell *matCellDef="let r" class="font-mono text-gray-400">{{ r.quantity }} SHARES</td>
            </ng-container>

            <ng-container matColumnDef="avgPrice">
              <th mat-header-cell *matHeaderCellDef> ACQUISITION PRICE </th>
              <td mat-cell *matCellDef="let r" class="font-mono text-gray-400">₹{{ r.averagePrice.toLocaleString() }}</td>
            </ng-container>

            <ng-container matColumnDef="currentPrice">
              <th mat-header-cell *matHeaderCellDef> MARKET PRICE </th>
              <td mat-cell *matCellDef="let r" class="font-mono text-white">₹{{ r.currentPrice.toLocaleString() }}</td>
            </ng-container>

            <ng-container matColumnDef="marketValue">
              <th mat-header-cell *matHeaderCellDef> MARKET VALUE </th>
              <td mat-cell *matCellDef="let r" class="font-mono text-white">₹{{ r.marketValue.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</td>
            </ng-container>

            <ng-container matColumnDef="gainLoss">
              <th mat-header-cell *matHeaderCellDef> DELTA </th>
              <td mat-cell *matCellDef="let r" [class.text-green-500]="r.pnl >= 0" [class.text-red-600]="r.pnl < 0" class="font-mono text-right pr-6">
                <div class="flex flex-col">
                  <span>{{ r.pnl >= 0 ? '+' : '' }}₹{{ r.pnl.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</span>
                  <span class="text-[10px] opacity-60">[{{ r.pnlPercent >= 0 ? '+' : '' }}{{ r.pnlPercent.toFixed(2) }}%]</span>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          
          <div *ngIf="filteredRows.length === 0" class="p-12 text-center">
            <p class="text-gray-700 uppercase tracking-widest text-xs font-bold">No holdings found</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { 
      display: block; 
      background: var(--bg); 
      min-height: 100vh;
      font-family: 'Inter', sans-serif;
    }

    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 20px;
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
      letter-spacing: 3px; margin-bottom: 8px;
    }

    .stat-value {
      font-size: 24px; font-weight: 900; letter-spacing: -1px;
    }

    .ticker-box {
      background: var(--surface-2); color: var(--text); padding: 3px 8px; font-family: monospace;
      font-size: 10px; font-weight: bold; border-radius: 2px; border: 1px solid var(--border);
    }

    .company-logo {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      object-fit: cover;
      border: 1px solid var(--border);
    }

    .premium-table {
      width: 100%; background: transparent !important;
      th {
        background: var(--surface-2) !important; color: var(--text-muted) !important; font-size: 10px !important;
        font-weight: 800 !important; letter-spacing: 2px !important; padding: 10px 16px !important;
        border-bottom: 1px solid var(--border) !important;
      }
      td { padding: 0 16px !important; border-bottom: 1px solid var(--border) !important; background: transparent !important; }
      tr:hover td { background: color-mix(in srgb, var(--text) 4%, transparent) !important; }
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
  `]
})
export class BalanceComponent {
  private readonly portfolioApi = inject(PortfolioApiService);
  private readonly stockApi = inject(StockApiService);
  private readonly companiesApi = inject(CompaniesApiService);

  portfolios: Portfolio[] = [];
  rows: BalanceRow[] = [];
  private readonly companies = new Map<string, Company>();

  selectedPortfolioId: number = 0;

  displayedColumns: string[] = ['portfolio', 'asset', 'quantity', 'avgPrice', 'currentPrice', 'marketValue', 'gainLoss'];

  constructor() {
    forkJoin({
      portfolios: this.portfolioApi.getPortfolios(),
      stocks: this.stockApi.getStocks(),
      companies: this.companiesApi.getCompanies()
    }).subscribe(({ portfolios, stocks, companies }) => {
      this.setupCompaniesRegistry(companies);
      this.portfolios = portfolios;
      this.rows = this.buildRows(portfolios, stocks);
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

  get filteredRows(): BalanceRow[] {
    if (!this.selectedPortfolioId) return this.rows;
    return this.rows.filter(r => r.portfolioId === this.selectedPortfolioId);
  }

  get totalMarketValue(): number {
    return this.filteredRows.reduce((sum, r) => sum + r.marketValue, 0);
  }

  get totalCostValue(): number {
    return this.filteredRows.reduce((sum, r) => sum + r.costValue, 0);
  }

  get totalPnl(): number {
    return this.filteredRows.reduce((sum, r) => sum + r.pnl, 0);
  }

  private buildRows(portfolios: Portfolio[], stocks: Stock[]): BalanceRow[] {
    const bySymbol = new Map(stocks.map(s => [s.symbol, s] as const));

    const rows: BalanceRow[] = [];
    for (const p of portfolios) {
      for (const h of (p.holdings ?? [])) {
        const stock = bySymbol.get(h.symbol);
        const company = this.companies.get(h.symbol.toUpperCase());
        const currentPrice = Number(stock?.currentPrice ?? h.averagePrice);
        const averagePrice = Number(h.averagePrice);
        const quantity = Number(h.quantity);

        const costValue = averagePrice * quantity;
        const marketValue = currentPrice * quantity;
        const pnl = marketValue - costValue;
        const pnlPercent = costValue ? (pnl / costValue) * 100 : 0;

        rows.push({
          portfolioId: p.id,
          portfolioName: p.name,
          symbol: h.symbol,
          companyName: stock?.name ?? (company?.name || h.symbol),
          companyLogoUrl: company?.logoUrl,
          quantity,
          averagePrice,
          currentPrice,
          costValue,
          marketValue,
          pnl,
          pnlPercent,
        });
      }
    }

    return rows.sort((a, b) => b.marketValue - a.marketValue);
  }
}
