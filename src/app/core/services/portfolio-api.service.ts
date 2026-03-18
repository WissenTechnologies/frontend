import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Holding {
  id?: number;
  symbol: string;
  quantity: number;
  averagePrice: number;
}

export interface Portfolio {
  id: number;
  name: string;
  availableCash: number;
  holdings: Holding[];
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getPortfolios(): Observable<Portfolio[]> {
    return this.http.get<Portfolio[]>(`${this.apiUrl}/portfolios`);
  }

  createPortfolio(name: string, initialCash: number): Observable<Portfolio> {
    return this.http.post<Portfolio>(`${this.apiUrl}/portfolios`, { name, availableCash: initialCash });
  }

  updatePortfolio(id: number, name: string, availableCash: number): Observable<Portfolio> {
    return this.http.put<Portfolio>(`${this.apiUrl}/portfolios/${id}`, { name, availableCash });
  }

  deletePortfolio(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/portfolios/${id}`);
  }

  executeTrade(portfolioId: number, symbol: string, quantity: number, type: 'BUY' | 'SELL'): Observable<Portfolio> {
    return this.http.post<Portfolio>(`${this.apiUrl}/portfolios/${portfolioId}/trade`, {
      symbol,
      quantity,
      type
    });
  }

  getAllPortfoliosAdmin(): Observable<Portfolio[]> {
    return this.http.get<Portfolio[]>(`${this.apiUrl}/portfolios/all`);
  }
}
