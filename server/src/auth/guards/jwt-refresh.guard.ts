import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtRefreshGuard extends AuthGuard("jwt-refresh") {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleRequest(err: any, user: any, _info: any) {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          "Invalid or expired refresh token. Please login again.",
        )
      );
    }
    return user;
  }
}
