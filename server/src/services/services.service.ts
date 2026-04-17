import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "../libs/prisma";
import { CreateServiceDto } from "./dto/create-service.dto";

@Injectable()
export class ServicesService {
  async create(userId: string, createServiceDto: CreateServiceDto) {
    const service = await prisma.service.create({
      data: {
        ...createServiceDto,
        userId,
      },
    });
    return {
      message: "Service created successfully",
      data: service,
    };
  }

  async findAll(userId: string) {
    const services = await prisma.service.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return {
      message: "Services retrieved successfully",
      data: services,
    };
  }

  async findOne(userId: string, id: string) {
    const service = await prisma.service.findFirst({
      where: { id, userId },
      include: {
        deployments: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with id ${id} not found`);
    }

    return {
      message: "Service retrieved successfully",
      data: service,
    };
  }

  async remove(userId: string, id: string) {
    const service = await prisma.service.findFirst({
      where: { id, userId },
    });

    if (!service) {
      throw new NotFoundException(`Service with id ${id} not found`);
    }

    await prisma.service.delete({
      where: { id },
    });

    return {
      message: "Service deleted successfully",
    };
  }

  // Deployment related methods
  async createDeployment(userId: string, serviceId: string) {
    // Verify service ownership
    const service = await prisma.service.findFirst({
      where: { id: serviceId, userId },
    });

    if (!service) {
      throw new NotFoundException(`Service with id ${serviceId} not found`);
    }

    const deployment = await prisma.deployment.create({
      data: {
        serviceId,
        status: "PENDING",
      },
    });

    // Update service status
    await prisma.service.update({
      where: { id: serviceId },
      data: { status: "BUILDING" },
    });

    return {
      message: "Deployment triggered successfully",
      data: deployment,
    };
  }

  async getDeployments(userId: string, serviceId: string) {
    // Verify service ownership
    const service = await prisma.service.findFirst({
      where: { id: serviceId, userId },
    });

    if (!service) {
      throw new NotFoundException(`Service with id ${serviceId} not found`);
    }

    const deployments = await prisma.deployment.findMany({
      where: { serviceId },
      orderBy: { createdAt: "desc" },
    });

    return {
      message: "Deployments retrieved successfully",
      data: deployments,
    };
  }
}
