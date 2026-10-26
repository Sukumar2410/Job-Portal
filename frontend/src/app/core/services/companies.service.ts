import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { API } from '../constants/api.constants';

import {
  Company,
  CompanyAdminDetails
} from '../models/company.model';

import { PaginatedResponse } from '../models/common.model';


export interface CompanyFilters {
  search?: string;
  industry?: string;
  company_size?: string;
  is_verified?: string;
  ordering?: string;
  page?: number;
}


@Injectable({
  providedIn: 'root'
})
export class CompaniesService {

  private api = inject(ApiService);


  // ==========================================================
  // HR ENDPOINTS
  // ==========================================================

  /**
   * Get the company associated with the currently
   * authenticated HR user.
   */
  getMyCompany(): Observable<Company> {

    return this.api.get<Company>(
      API.COMPANIES.MY_COMPANY
    );

  }


  /**
   * Create a new company.
   */
  createCompany(
    payload: Partial<Company>
  ): Observable<Company> {

    return this.api.post<Company>(
      API.COMPANIES.LIST,
      payload
    );

  }


  /**
   * Update an existing company.
   */
  updateCompany(
    slug: string,
    payload: Partial<Company>
  ): Observable<Company> {

    return this.api.patch<Company>(
      API.COMPANIES.DETAIL(slug),
      payload
    );

  }


  /**
   * Get basic company details.
   */
  getCompany(
    slug: string
  ): Observable<Company> {

    return this.api.get<Company>(
      API.COMPANIES.DETAIL(slug)
    );

  }


  /**
   * Get complete company details for Admin.
   *
   * This endpoint returns the extended company information,
   * including:
   *
   * - Company information
   * - Job statistics
   * - Application statistics
   * - Application pipeline
   * - Job quota
   * - Recent jobs
   */
  getAdminCompanyDetails(
    slug: string
  ): Observable<CompanyAdminDetails> {

    return this.api.get<CompanyAdminDetails>(
      API.COMPANIES.ADMIN_DETAILS(slug)
    );

  }


  // ==========================================================
  // ADMIN ENDPOINTS
  // ==========================================================

  /**
   * Get paginated list of companies for Admin.
   */
  listCompanies(
    filters?: CompanyFilters
  ): Observable<PaginatedResponse<Company>> {

    return this.api.get<PaginatedResponse<Company>>(
      API.COMPANIES.LIST,
      filters
    );

  }


  /**
   * Verify a company.
   */
  verifyCompany(
    slug: string
  ): Observable<any> {

    return this.api.post(
      API.COMPANIES.VERIFY(slug),
      {}
    );

  }


  /**
   * Revoke company verification.
   */
  unverifyCompany(
    slug: string
  ): Observable<any> {

    return this.api.post(
      API.COMPANIES.UNVERIFY(slug),
      {}
    );

  }

}