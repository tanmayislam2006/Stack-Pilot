import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
} from "@nestjs/common";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import { JwtPayload } from "./interfaces/jwt-payload.interface";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const { user } = await this.authService.register(registerDto);

    return {
      message: "Registered successfully",
      user,
    };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(loginDto);

    // Note: We are no longer strictly managing Better Auth session cookies here,
    // as we are using a Stateless JWT architecture.

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 15, // 15 minutes
    });

    // Set Refresh Token Cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return {
      message: "Logged in successfully",
      ...user,
    };
  }
  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request) {
    const user = req.user as JwtPayload;
    const result = await this.authService.getMe(user.userId);
    return {
      message: "Profile fetched successfully",
      ...result,
    };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    // BetterAuth session token cleanup if the client set it natively
    res.clearCookie("better-auth.session_token");
    return { message: "Logged out successfully" };
  }

  @Post("refresh")
  @UseGuards(JwtRefreshGuard)
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as JwtPayload;
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      user.userId,
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 15, // 15 minutes
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return { message: "Tokens refreshed successfully" };
  }
}
