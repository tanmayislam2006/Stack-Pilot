import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "../libs/prisma";
import { CreateServiceDto } from "./dto/create-service.dto";
import { GitService } from "./git.service";
import { DockerService } from "./docker.service";
import { PortService } from "./port.service";
import { LogsGateway } from "./logs.gateway";

@Injectable()
export class ServicesService {
  constructor(
    private readonly gitService: GitService,
    private readonly dockerService: DockerService,
    private readonly portService: PortService,
    private readonly logsGateway: LogsGateway,
  ) {}

  async create(userId: string, createServiceDto: CreateServiceDto) {
    const { envVars, ...serviceData } = createServiceDto;

    const queryData: any = {
      ...serviceData,
      userId,
    };

    if (envVars && Object.keys(envVars).length > 0) {
      queryData.environmentVariables = {
        create: Object.entries(envVars).map(([key, value]) => ({
          key,
          value,
        })),
      };
    }

    const service = await prisma.service.create({
      data: queryData,
      include: { environmentVariables: true },
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
        environmentVariables: true,
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

    // Stop and remove docker container if it exists
    if (service.containerId) {
      await this.dockerService.stopContainer(id);
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

    // Run the deployment logic in the background so request can return immediately
    this.runDeployment(service.id, deployment.id, service.repoUrl).catch(
      console.error,
    );

    return {
      message: "Deployment triggered successfully",
      data: deployment,
    };
  }

  private async runDeployment(
    serviceId: string,
    deploymentId: string,
    repoUrl: string,
  ) {
    let logs = "Starting deployment...\n";
    const appendLog = async (msg: string) => {
      logs += `${new Date().toISOString()} - ${msg}\n`;
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { logs },
      });
      // Stream real-time logs via WebSocket to connected frontend clients
      this.logsGateway.broadcastLog(deploymentId, msg);
    };

    try {
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: "IN_PROGRESS" },
      });

      // 1. Allocate Port
      await appendLog("Allocating port...");
      const serviceData = await prisma.service.findUnique({
        where: { id: serviceId },
      });
      let port = serviceData?.port;
      if (!port) {
        port = await this.portService.allocatePort();
        await prisma.service.update({
          where: { id: serviceId },
          data: { port },
        });
      }
      await appendLog(`Assigned port ${port}.`);

      // 2. Clone Repo
      await appendLog(`Cloning repository (branch: ${serviceData?.branch})...`);
      const targetDir = await this.gitService.cloneRepo(
        repoUrl,
        serviceId,
        serviceData?.branch,
      );
      await appendLog(`Cloned repository to workspace.`);

      // 3. Build Docker Image
      await appendLog("Building Docker image...");
      const imageName = await this.dockerService.buildImage(
        serviceId,
        targetDir,
      );
      await appendLog(`Built Docker image: ${imageName}.`);

      // Database Env Vars lookup
      const envVars = await prisma.environmentVariable.findMany({
        where: { serviceId },
      });
      const envRecord = envVars.reduce(
        (acc, curr) => ({ ...acc, [curr.key]: curr.value }),
        {},
      );

      // 4. Health Check Security Ping
      await appendLog(
        "Booting isolated test container for generic framework health checks...",
      );
      const isHealthy = await this.dockerService.healthCheckImage(
        serviceId,
        imageName,
        serviceData?.internalPort,
        envRecord,
      );

      if (!isHealthy) {
        throw new Error(
          "Application crashed on startup during internal health checks. Deployment stopped immediately. Your live site was NOT taken offline.",
        );
      }
      await appendLog(
        "Health check completely passed! Safely routing network traffic to new container...",
      );

      // 5. Run Live Container

      const containerId = await this.dockerService.runContainer(
        serviceId,
        imageName,
        port,
        serviceData?.internalPort,
        envRecord,
      );
      await appendLog(
        `Container started successfully with ID: ${containerId.substring(0, 12)}.`,
      );

      // Success Update
      await prisma.service.update({
        where: { id: serviceId },
        data: { status: "RUNNING", containerId },
      });
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: "SUCCESS" },
      });
    } catch (error: any) {
      await appendLog(`ERROR: ${error.message}`);
      await prisma.service.update({
        where: { id: serviceId },
        data: { status: "ERROR" },
      });
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: "FAILED" },
      });
    } finally {
      await appendLog("Cleaning up workspace...");
      await this.gitService.cleanup(serviceId);
      await appendLog("Cleanup complete. Deployment process finished.");
    }
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
