import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API } from '../constants/api.constants';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private api = inject(ApiService);

  getCandidateProfile(): Observable<any> {
    return this.api.get(API.AUTH.CANDIDATE_PROFILE);
  }

  updateCandidateProfile(data: any): Observable<any> {
    return this.api.patch(API.AUTH.CANDIDATE_PROFILE, data);
  }

  uploadProfilePicture(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('profile_picture', file);

    return this.api.patchFormData(
      API.AUTH.CANDIDATE_PROFILE,
      formData
    );
  }

  uploadResume(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('resume', file);
    return this.api.postFormData(API.AUTH.UPLOAD_RESUME, formData);
  }

  deleteResume(): Observable<any> {
    return this.api.delete(API.AUTH.DELETE_RESUME);
  }
}