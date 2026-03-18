import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Stock {
  symbol: string;
  name: string;
  currentPrice: number;
  dayHigh: number;
  dayLow: number;
  volume: string;
  marketCap: string;
}

export interface StockHistory {
  date: string;
  price: number;
}

@Injectable({
  providedIn: 'root'
})
export class StockApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getStocks(): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.apiUrl}/stocks`);
  }

  getStockDetails(symbol: string): Observable<Stock> {
    return this.http.get<Stock>(`${this.apiUrl}/stocks/${symbol}`);
  }

  getStockHistory(symbol: string): Observable<StockHistory[]> {
    return this.http.get<StockHistory[]>(`${this.apiUrl}/stocks/${symbol}/history`);
  }
}
