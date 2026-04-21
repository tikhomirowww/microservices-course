import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {firstValueFrom} from 'rxjs'

@Injectable()
export class AuthService {
    private readonly authServiceUrl: string
    
    constructor(
        private readonly httpService: HttpService,
        private readonly config: ConfigService,
  ) {
    this.authServiceUrl = this.config.getOrThrow('AUTH_SERVICE_URL');
  }

  async register(dto: any) {
    const {data} = await firstValueFrom(this.httpService.post(`${this.authServiceUrl}/auth/register`, dto))
    return data
  }

  async login(dto: any) {
    const {data} = await firstValueFrom(this.httpService.post(`${this.authServiceUrl}/auth/login`, dto))
    return data
  }
}
