import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import CircuitBreaker from "opossum";
import { firstValueFrom, from, Observable } from "rxjs";

@Injectable()
export class CircuitBreakerInterceptor implements NestInterceptor {
  private readonly breaker: CircuitBreaker;

  constructor() {
    this.breaker = new CircuitBreaker(
      (next: Observable<any>) => firstValueFrom(next),
      { timeout: 3000, errorThresholdPercentage: 50, resetTimeout: 30000 },
    );
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return from(this.breaker.fire(next.handle()));
  }
}
