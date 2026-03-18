import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface Company {
  id: number;
  name: string;
  ticker: string;
  sector: string;
  website?: string;
  logoUrl?: string;
  marketCap: string;
  price: number;
  totalShares: number;
  outstandingShares: number;
  availableShares: number;
}

export interface CreateCompanyRequest {
  name: string;
  ticker: string;
  sector: string;
  website?: string;
  logoUrl?: string;
  marketCap: string;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class CompaniesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.apiUrl}/companies`);
  }

  createCompany(payload: CreateCompanyRequest): Observable<Company> {
    return this.http.post<Company>(`${this.apiUrl}/companies`, payload);
  }

  updateCompany(id: number, payload: Partial<CreateCompanyRequest & { marketCap: string; price: number }>): Observable<Company> {
    return this.http.put<Company>(`${this.apiUrl}/companies/${id}`, payload);
  }

  deleteCompany(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/companies/${id}`);
  }

  issueShares(companyId: number, quantity: number): Observable<Company> {
    return this.http.post<Company>(`${this.apiUrl}/companies/${companyId}/issue-shares`, { quantity });
  }

  suggestCompanies(query: string): Observable<Array<{ name: string; domain: string; logo?: string }>> {
    return this.http.get<Array<{ name: string; domain: string; logo?: string }>>(
      `${this.apiUrl}/companies/suggest?query=${encodeURIComponent(query)}`
    );
  }
}
