import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, Observable } from 'rxjs';
import { AUTH_FACADE } from '../../auth/tokens';
import { TradingChartComponent } from '../../shared/ui/trading-chart/trading-chart.component';
import { StockApiService } from '../../core/services/stock-api.service';
import { PortfolioApiService, Portfolio } from '../../core/services/portfolio-api.service';
import { CompaniesApiService, Company } from '../../core/services/companies-api.service';
import { interval, Subscription, startWith, switchMap } from 'rxjs';

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface StockDetail extends Stock {
  dayHigh: number;
  dayLow: number;
  volume: string;
  marketCap: string;
  history: { date: string; price: number }[];
}

@Component({
  selector: 'app-market',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatIconModule,
    TradingChartComponent
  ],
  templateUrl: './market.component.html',
  styleUrls: ['./market.component.scss']
})
export class MarketComponent implements OnDestroy {
  private readonly stockApi = inject(StockApiService);
  private readonly portfolioApi = inject(PortfolioApiService);
  private readonly companiesApi = inject(CompaniesApiService);
  private readonly authFacade = inject(AUTH_FACADE);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly authUser$ = this.authFacade.authUser$;

  private readonly lastPricesBySymbol = new Map<string, number>();
  private readonly backendPricesBySymbol = new Map<string, number>();

  selectedStock: any = null;
  orderType: 'market' | 'limit' = 'market';
  quantity: number = 1;
  buyOrder: boolean = true;
  searchTerm: string = '';
  limitPrice: number | null = null;

  // Fixed: Using BehaviorSubject pattern to prevent ExpressionChangedAfterItHasBeenCheckedError
  private stocksSubject = new BehaviorSubject<any[]>([]);
  readonly stocks$ = this.stocksSubject.asObservable();

  private readonly allowedSymbols = new Set<string>();
  private readonly companies = new Map<string, Company>(); // ticker -> Company
  
  portfolios: Portfolio[] = [];
  selectedPortfolioId: number | null = null;
  
  private pollingSub?: Subscription;
  private stocksPollingSub?: Subscription;
  private uiTickSub?: Subscription;

  displayedColumns: string[] = ['symbol', 'logo', 'name', 'price', 'change', 'changePercent'];

  constructor() {
    this.refreshCompaniesRegistry();
    this.refreshStocks();
    this.refreshPortfolios();
    
    // Backend poll only (pure backend updates)
    this.stocksPollingSub = interval(1000).subscribe(() => this.refreshStocks());
  }

  private refreshStocks() {
    this.stockApi.getStocks().subscribe(stocks => {
      // Defer to next macrotask to avoid NG0100 in dev mode.
      setTimeout(() => {
        const processedStocks = stocks.map((s: any) => {
          const symbol = (s.symbol ?? s.ticker ?? '').toString();
          const incoming = Number(s.currentPrice ?? s.price);

          // Pure backend-driven UI: use incoming price, compute change vs last tick.
          const currentPrice = Number.isFinite(incoming) && incoming > 0 ? incoming : 0;

          const prevPrice = this.lastPricesBySymbol.get(symbol);
          const change = prevPrice != null && prevPrice !== 0 ? currentPrice - prevPrice : 0;
          const changePercent = prevPrice != null && prevPrice !== 0 ? (change / prevPrice) * 100 : 0;

          this.lastPricesBySymbol.set(symbol, currentPrice);

          const company = this.companies.get(symbol);
          return {
            ...s,
            symbol,
            price: currentPrice,
            change,
            changePercent,
            logoUrl: company?.logoUrl,
          };
        });

        // Only show companies that exist in the admin-managed company registry.
        const filtered = this.allowedSymbols.size
          ? processedStocks.filter((x: any) => this.allowedSymbols.has((x.symbol ?? '').toString().toUpperCase()))
          : [];

        this.stocksSubject.next(filtered);

        if (this.selectedStock?.symbol) {
          const updated = filtered.find((x: any) => x.symbol === this.selectedStock.symbol);
          if (updated) {
            this.selectedStock = {
              ...this.selectedStock,
              price: updated.price,
              change: updated.change,
              changePercent: updated.changePercent,
              logoUrl: updated.logoUrl,
            };
          } else {
            this.selectedStock = null;
          }
        }

        this.cdr.markForCheck();
      }, 0);
    });
  }

  private refreshCompaniesRegistry() {
    this.companiesApi.getCompanies().subscribe({
      next: (companies: Company[]) => {
        // Defer to next macrotask to avoid NG0100 in dev mode.
        setTimeout(() => {
          this.allowedSymbols.clear();
          this.companies.clear();
          for (const c of companies) {
            if (c?.ticker) {
              const ticker = c.ticker.toString().trim().toUpperCase();
              this.allowedSymbols.add(ticker);
              this.companies.set(ticker, c);
            }
          }
          // Re-filter the board immediately after registry is loaded.
          this.refreshStocks();
          this.cdr.markForCheck();
        }, 0);
      },
      error: () => {
        // If registry fails, hide market listings (admin-managed catalog is the source of truth).
        this.allowedSymbols.clear();
        this.companies.clear();
        this.stocksSubject.next([]);
        this.selectedStock = null;
        this.cdr.markForCheck();
      }
    });
  }

  private applyUiTick() {
    const current = this.stocksSubject.value;
    if (!current.length) return;

    // Defer UI mutations to next macrotask to avoid ExpressionChangedAfterItHasBeenCheckedError.
    setTimeout(() => {
      const next = current.map((s: any) => {
        const symbol = (s.symbol ?? '').toString();
        const base = this.backendPricesBySymbol.get(symbol) ?? s.price;
        const prev = this.lastPricesBySymbol.get(symbol) ?? base;

        if (!Number.isFinite(base) || base <= 0) {
          return s;
        }

        // Small random walk around backend anchor.
        const jitterPct = 0.002; // 0.2%
        const rand = (Math.random() - 0.5) * jitterPct;
        const price = Math.max(0.01, base * (1 + rand));

        const change = price - prev;
        const changePercent = prev ? (change / prev) * 100 : 0;

        this.lastPricesBySymbol.set(symbol, price);

        return {
          ...s,
          price,
          change,
          changePercent,
        };
      });

      this.stocksSubject.next(next);

      if (this.selectedStock?.symbol) {
        const updated = next.find((x: any) => x.symbol === this.selectedStock.symbol);
        if (updated) {
          this.selectedStock = {
            ...this.selectedStock,
            price: updated.price,
            change: updated.change,
            changePercent: updated.changePercent,
          };
        }
      }

      this.cdr.markForCheck();
    }, 0);
  }

  private refreshPortfolios() {
    this.portfolioApi.getPortfolios().subscribe(portfolios => {
      this.portfolios = portfolios;
      if (portfolios.length > 0 && !this.selectedPortfolioId) {
        this.selectedPortfolioId = portfolios[0].id;
      }
    });
  }

  get filteredStocks() {
    return this.stocksSubject.value.filter((s: any) => 
      s.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
      s.symbol.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  selectStock(stock: any) {
    this.stopPolling();

    this.selectedStock = {
      ...stock,
      price: Number(stock.price ?? stock.currentPrice ?? 0),
      change: Number(stock.change ?? 0),
      changePercent: Number(stock.changePercent ?? 0),
    };
    
    // Start polling history for selected stock every 10 seconds
    this.pollingSub = interval(10000).pipe(
      startWith(0),
      switchMap(() => this.stockApi.getStockHistory(stock.symbol))
    ).subscribe(history => {
      // Defer the update to the next change detection cycle
      setTimeout(() => {
        const updatedSelectedStock = {
          ...this.selectedStock,
          dayHigh: stock.dayHigh,
          dayLow: stock.dayLow,
          volume: stock.volume,
          marketCap: stock.marketCap,
          history: history.map(h => ({ date: h.date, price: h.price }))
        };
        
        // Also update the stock price in the main board if it changed
        const realTimeStock = this.stocksSubject.value.find((s: any) => s.symbol === stock.symbol);
        if (history.length > 0) {
          const latestPrice = history[history.length - 1].price;

          const prev = this.selectedStock.price;
          const change = prev ? latestPrice - prev : 0;
          const changePercent = prev ? (change / prev) * 100 : 0;

          updatedSelectedStock.price = latestPrice;
          updatedSelectedStock.change = change;
          updatedSelectedStock.changePercent = changePercent;

          if (realTimeStock) {
            const updatedRealTimeStock = {
              ...realTimeStock,
              price: latestPrice,
              change: change,
              changePercent: changePercent
            };
            
            // Update stocks array with new real-time stock
            const updatedStocks = this.stocksSubject.value.map((s: any) => 
              s.symbol === stock.symbol ? updatedRealTimeStock : s
            );
            this.stocksSubject.next(updatedStocks);
          }
        }
        
        this.selectedStock = updatedSelectedStock;
      }, 0);
    });
  }

  private stopPolling() {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
  }

  ngOnDestroy() {
    this.stopPolling();
    if (this.stocksPollingSub) {
      this.stocksPollingSub.unsubscribe();
    }
    if (this.uiTickSub) {
      this.uiTickSub.unsubscribe();
    }
  }

  get estimatedTotal(): number {
    if (!this.selectedStock) return 0;
    const price = this.orderType === 'limit' && this.limitPrice ? this.limitPrice : this.selectedStock.price;
    return price * this.quantity;
  }

  canAccessTrading(user: any): boolean {
    if (!user || !user.role) return false;
    const role = user.role.toString().toLowerCase();
    return role === 'user';
  }

  onBuySell() {
    if (!this.selectedStock || !this.selectedPortfolioId) return;

    const selectedPortfolio = this.portfolios.find(p => p.id === this.selectedPortfolioId);
    if (!selectedPortfolio) {
      alert('Please select a portfolio.');
      return;
    }

    const type = this.buyOrder ? 'BUY' : 'SELL';
    const price = this.orderType === 'limit' && this.limitPrice ? this.limitPrice : this.selectedStock.price;

    if (type === 'BUY') {
      const estTotal = this.estimatedTotal;
      if (!Number.isFinite(estTotal) || estTotal <= 0) {
        alert('Invalid order total.');
        return;
      }
      if (selectedPortfolio.availableCash < estTotal) {
        alert(`Insufficient funds. Available: ₹${Number(selectedPortfolio.availableCash).toFixed(2)}`);
        return;
      }
    }

    // For limit orders, validate limit price
    if (this.orderType === 'limit') {
      if (!this.limitPrice || this.limitPrice <= 0) {
        alert('Please enter a valid limit price.');
        return;
      }
      
      // Additional validation for limit orders
      if (type === 'BUY' && this.limitPrice > this.selectedStock.price) {
        if (!confirm(`Limit price ₹${this.limitPrice.toFixed(2)} is above current market price ₹${this.selectedStock.price.toFixed(2)}. Continue?`)) {
          return;
        }
      }
      
      if (type === 'SELL' && this.limitPrice < this.selectedStock.price) {
        if (!confirm(`Limit price ₹${this.limitPrice.toFixed(2)} is below current market price ₹${this.selectedStock.price.toFixed(2)}. Continue?`)) {
          return;
        }
      }
    }

    const orderData = {
      symbol: this.selectedStock.symbol,
      quantity: this.quantity,
      type: type,
      orderType: this.orderType,
      limitPrice: this.orderType === 'limit' ? this.limitPrice : undefined
    };

    // For now, show a confirmation message (frontend only)
    const orderDescription = this.orderType === 'limit' 
      ? `${type} ${this.quantity} shares of ${this.selectedStock.symbol} at limit price ₹${price.toFixed(2)}`
      : `${type} ${this.quantity} shares of ${this.selectedStock.symbol} at market price ₹${price.toFixed(2)}`;
    
    if (confirm(`Confirm order: ${orderDescription}?`)) {
      alert(`Order placed successfully!\n\nOrder Details:\n${orderDescription}\nTotal: ₹${this.estimatedTotal.toFixed(2)}`);
      
      // In a real implementation, you would call the API here:
      // this.portfolioApi.executeLimitOrder(this.selectedPortfolioId, orderData)
      //   .subscribe({ ... });
      
      // Reset form
      this.quantity = 1;
      this.limitPrice = null;
      this.orderType = 'market';
    }
  }
}
