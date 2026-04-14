/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface Response<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data: any) => {
        // If data is already carefully formatted or undefined, handle gracefully
        const resMessage = data?.message || "Operation successful";
        const resMeta = data?.meta;

        // Extract data specifically if the controller wrapped it in a "data" property,
        // otherwise return the whole object, but exclude top-level custom keys if we manually mapped them
        let resData = data;

        if (data && typeof data === "object") {
          if (data.data !== undefined) {
            resData = data.data;
          } else {
            // Remove message and meta from the main data payload if they exist at the root
            const { message, meta, ...rest } = data;
            // If it was just { message }, then rest is {}, we return null or {}
            resData = Object.keys(rest).length ? rest : null;
          }
        }

        return {
          statusCode,
          success: statusCode >= 200 && statusCode < 300,
          message: resMessage,
          data: resData,
          meta: resMeta,
        };
      }),
    );
  }
}
