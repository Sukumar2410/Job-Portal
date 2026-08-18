import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API } from '../constants/api.constants';
import { Company, CompanyAdminDetails } from '../models/company.model';
import { PaginatedResponse } from '../models/common.model';

export interface CompanyFilters {
  search?: string;
  industry?: string;
  company_size?: string;
  is_verified?: string;
  ordering?: string;
  page?: number;
}

@Injectable({ providedIn: 'root' })
export class CompaniesService {
  private api = inject(ApiService);

  // HR endpoints
  getMyCompany(): Observable<Company> {
    return this.api.get<Company>(API.COMPANIES.MY_COMPANY);
  }

  createCompany(payload: Partial<Company>): Observable<Company> {
    return this.api.post<Company>(API.COMPANIES.LIST, payload);
  }

  updateCompany(slug: string, payload: Partial<Company>): Observable<Company> {
    return this.api.patch<Company>(API.COMPANIES.DETAIL(slug), payload);
  }

  getCompany(slug: string): Observable<Company> {
    return this.api.get<Company>(API.COMPANIES.DETAIL(slug));
  }

  getCompanyAdminDetails(
    slug: string
  ): Observable<CompanyAdminDetails> {
    return this.api.get<CompanyAdminDetails>(
      API.COMPANIES.ADMIN_DETAILS(slug)
    );
  }

  // Admin endpoints
  listCompanies(filters?: CompanyFilters): Observable<PaginatedResponse<Company>> {
    return this.api.get<PaginatedResponse<Company>>(API.COMPANIES.LIST, filters);
  }

  verifyCompany(slug: string): Observable<any> {
    return this.api.post(API.COMPANIES.VERIFY(slug), {});
  }

  unverifyCompany(slug: string): Observable<any> {
    return this.api.post(API.COMPANIES.UNVERIFY(slug), {});
  }
}