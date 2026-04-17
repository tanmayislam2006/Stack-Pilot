import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { prisma } from "../libs/prisma";
import { auth } from "../libs/auth";

// Mock the libraries that are imported as constants
jest.mock("../libs/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
    },
  },
}));

jest.mock("../libs/auth", () => ({
  auth: {
    api: {
      signInEmail: jest.fn(),
      signUpEmail: jest.fn(),
    },
  },
}));

describe("AuthService", () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockUser = {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
    role: "USER",
    status: "ACTIVE",
    isDeleted: false,
    emailVerified: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue("mock-token"),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("login", () => {
    const loginDto = { email: "test@example.com", password: "password123" };

    it("should successfully login a user and return tokens", async () => {
      // Mock prisma findUnique
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      // Mock better-auth signInEmail
      (auth.api.signInEmail as jest.Mock).mockResolvedValue({
        user: mockUser,
        token: "session-token",
      });

      const result = await service.login(loginDto);

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result.user.email).toBe(mockUser.email);
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if user is not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw ForbiddenException if user is blocked", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        status: "BLOCKED",
      });

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException if user is deleted", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        isDeleted: true,
      });

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe("register", () => {
    const registerDto = {
      email: "new@example.com",
      password: "password123",
      name: "New User",
    };

    it("should successfully register a new user", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (auth.api.signUpEmail as jest.Mock).mockResolvedValue({
        user: { ...mockUser, email: "new@example.com" },
      });

      const result = await service.register(registerDto);

      expect(result.user.email).toBe("new@example.com");
      expect(auth.api.signUpEmail).toHaveBeenCalled();
    });

    it("should throw ForbiddenException if email already exists", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
