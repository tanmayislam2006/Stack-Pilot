import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";
import { envVars } from "../../config/env";
import { JwtPayload } from "../interfaces/jwt-payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const data = request?.cookies["accessToken"];
          if (!data) {
            return null;
          }

          return data;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: envVars.ACCESS_TOKEN_SECRET,
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
    // We attach the payload returned here to the request object (req.user = payload)
    return payload;
  }
}
