import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class ApiService {
  constructor(private http: HttpClient) { }

  getRosters(): Observable<any> {
    return this.http.get(environment.apiUrl + '/getRoster' + '?rostergroupid=' + environment.rosterGroupId);
  }

  getHistory(): Observable<any> {
    return this.http.get(environment.apiUrl + '/getHistory' + '?rostergroupid=' + environment.rosterGroupId);
  }
}