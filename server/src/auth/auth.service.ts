import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { prisma } from "../libs/prisma";
import { auth } from "../libs/auth";
import { envVars } from "../config/env";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtPayload } from "./interfaces/jwt-payload.interface";
@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(payload: LoginDto) {
    const email = payload.email.trim().toLowerCase();
    const { password } = payload;

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isDeleted: true,
        emailVerified: true,
      },
    });

    if (!existingUser) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    // Type definition fallback in case UserStatus enum doesn't map directly
    if (existingUser.status === "BLOCKED") {
      throw new ForbiddenException(
        "Your account is blocked. Please contact support for more information.",
      );
    }

    if (existingUser.isDeleted || existingUser.status === "DELETED") {
      throw new ForbiddenException(
        "Your account is deleted. Please contact support for more information.",
      );
    }

    // Use better-auth for credential verification
    const data = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    if (!data || !data.user) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const jwtPayload: JwtPayload = {
      userId: existingUser.id,
      role: existingUser.role,
      name: existingUser.name,
      email: existingUser.email,
      status: existingUser.status,
      isDeleted: existingUser.isDeleted,
      emailVerified: existingUser.emailVerified,
    };

    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: envVars.ACCESS_TOKEN_SECRET,
      expiresIn: envVars.ACCESS_TOKEN_EXPIRES_IN as any,
    });

    const refreshToken = this.jwtService.sign(jwtPayload, {
      secret: envVars.REFRESH_TOKEN_SECRET,
      expiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN as any,
    });

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: existingUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7d, should ideally parse from env
      },
    });

    return {
      user: {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        status: data.user.status,
        isDeleted: data.user.isDeleted,
        emailVerified: data.user.emailVerified,
      },
      token: data.token,
      accessToken,
      refreshToken,
    };
  }
  async register(payload: RegisterDto) {
    const { email, password, name } = payload;
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw new ForbiddenException("A user with this email already exists.");
    }

    try {
      const data = await auth.api.signUpEmail({
        body: {
          email: cleanEmail,
          password,
          name,
        },
      });

      if (!data || !data.user) {
        throw new ForbiddenException("Failed to create account.");
      }

      return {
        user: {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          status: data.user.status,
          isDeleted: data.user.isDeleted,
          emailVerified: data.user.emailVerified,
        },
      };
    } catch (error: any) {
      throw new ForbiddenException(
        error?.message || "Failed to register account.",
      );
    }
  }
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException("User not found.");
    }
    return user;
  }
  async refreshTokens(userId: string, currentRefreshToken: string) {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new UnauthorizedException("User not found.");
    }

    if (
      existingUser.status === "BLOCKED" ||
      existingUser.isDeleted ||
      existingUser.status === "DELETED"
    ) {
      throw new ForbiddenException("Your account is blocked or deleted.");
    }

    // Verify if the refresh token exists in the database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: currentRefreshToken },
    });

    if (!storedToken) {
      // Possible token reuse attack! Revoke all tokens for this user for safety
      await prisma.refreshToken.deleteMany({ where: { userId } });
      throw new UnauthorizedException(
        "Invalid refresh token. Security alert: token may have been reused.",
      );
    }

    // Rotate token: delete the old one
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    const jwtPayload: JwtPayload = {
      userId: existingUser.id,
      role: existingUser.role,
      name: existingUser.name,
      email: existingUser.email,
      status: existingUser.status,
      isDeleted: existingUser.isDeleted,
      emailVerified: existingUser.emailVerified,
    };

    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: envVars.ACCESS_TOKEN_SECRET,
      expiresIn: envVars.ACCESS_TOKEN_EXPIRES_IN as any,
    });

    const refreshToken = this.jwtService.sign(jwtPayload, {
      secret: envVars.REFRESH_TOKEN_SECRET,
      expiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN as any,
    });

    // Store the new refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: existingUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(refreshToken: string) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
    return { message: "Logged out successfully" };
  }
}
