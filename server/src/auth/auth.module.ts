import { Module, Global } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtRefreshStrategy } from "./strategies/jwt-refresh.strategy";

@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      // We are configuring the secret directly in the strategy and service
      // as they have different expiration times and secrets for access/refresh
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
