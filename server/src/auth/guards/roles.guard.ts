/* eslint-disable prettier/prettier */
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@prisma/client";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // If no roles are required for this route, allow access
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    // Assumes user was attached to request by JwtAuthGuard
    if (!user) {
      return false; // Not authenticated
    }

    // Check if the user's role is in the list of required roles
    if (!requiredRoles.includes(user.role)) {
     throw new ForbiddenException("Forbidden: You don't have permission to access this resource");
    }

    return true;
  }
}
