import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { IFileRangeRequest } from 'src/interfaces/file.interface';
import { map } from 'rxjs/operators';

@Injectable()
export class RangeInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<IFileRangeRequest>();
    request.query.range = request.headers.range ?? '';
    return next.handle().pipe(
      map((data) => {
        return data;
      }),
    );
  }
}
