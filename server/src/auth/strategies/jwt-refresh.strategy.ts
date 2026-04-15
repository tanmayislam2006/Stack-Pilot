import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";
import { envVars } from "../../config/env";
import { JwtPayload } from "../interfaces/jwt-payload.interface";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  "jwt-refresh",
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const data = request?.cookies["refreshToken"];
          if (!data) {
            return null;
          }
          return data;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: envVars.REFRESH_TOKEN_SECRET,
    });
  }

  validate(payload: JwtPayload) {
    if (
      payload.isDeleted ||
      payload.status === "BLOCKED" ||
      payload.status === "DELETED"
    ) {
      throw new UnauthorizedException("Your account is blocked or deleted.");
    }
    return payload;
  }
}
