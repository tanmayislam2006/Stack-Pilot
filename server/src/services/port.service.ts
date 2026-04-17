import { Injectable } from "@nestjs/common";
import { prisma } from "../libs/prisma";

@Injectable()
export class PortService {
  private readonly START_PORT = 10000;

  async allocatePort(): Promise<number> {
    const services = await prisma.service.findMany({
      where: { port: { not: null } },
      select: { port: true },
      orderBy: { port: "asc" },
    });

    const takenPorts = new Set(services.map((s) => s.port));
    let port = this.START_PORT;
    while (takenPorts.has(port)) {
      port++;
    }

    return port;
  }
}
