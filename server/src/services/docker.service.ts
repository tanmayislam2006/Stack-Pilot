/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Injectable } from "@nestjs/common";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

@Injectable()
export class DockerService {
  async buildImage(
    serviceId: string,
    buildContextDir: string,
  ): Promise<string> {
    const imageName = `stackpilot-service-${serviceId}`;
    try {
      // Use Nixpacks for Zero-Config builds (auto-detects NodeJS, Python, Go, Rust, or default Dockerfiles)
      // Increased maxBuffer to 50MB since compiler logs can overflow the standard node buffer
      await execAsync(`npx --yes nixpacks build . --name ${imageName}`, {
        cwd: buildContextDir,
        maxBuffer: 1024 * 1024 * 50, // 50 MB
      });
    } catch (e) {
      throw new Error(
        `Nixpacks Build Engine Failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
    return imageName;
  }

  async runContainer(
    serviceId: string,
    imageName: string,
    hostPort: number,
    internalPort: number = 5000,
    envVars: Record<string, string> = {},
    memoryLimit: string = "512m",
    cpuLimit: number = 0.5,
  ): Promise<string> {
    const containerName = `stackpilot-container-${serviceId}`;

    // Gracefully stop the old container first to free the host port
    try {
      await execAsync(`docker rm -f ${containerName}`);
    } catch (e) {}

    let envString = `-e PORT=${internalPort} `;
    for (const [key, value] of Object.entries(envVars)) {
      envString += `-e ${key}="${value}" `;
    }

    const { stdout } = await execAsync(
      `docker run -d --memory="${memoryLimit}" --cpus="${cpuLimit}" --name ${containerName} -p ${hostPort}:${internalPort} ${envString.trim()} ${imageName}`,
    );

    return stdout.trim();
  }

  async healthCheckImage(
    serviceId: string,
    imageName: string,
    internalPort: number = 5000,
    envVars: Record<string, string> = {},
    memoryLimit: string = "512m",
    cpuLimit: number = 0.5,
  ): Promise<boolean> {
    const testContainer = `stackpilot-test-${serviceId}`;
    try {
      await execAsync(`docker rm -f ${testContainer}`).catch(() => {});

      let envString = `-e PORT=${internalPort} `;
      for (const [key, value] of Object.entries(envVars)) {
        envString += `-e ${key}="${value}" `;
      }

      // Boot generic isolated container without ANY public port mapping
      await execAsync(
        `docker run -d --memory="${memoryLimit}" --cpus="${cpuLimit}" --name ${testContainer} ${envString.trim()} ${imageName}`,
      );

      // Give the framework 5 full seconds to boot completely (avoids syntax crashes/failed DB bindings)
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const { stdout } = await execAsync(
        `docker inspect -f '{{.State.Running}}' ${testContainer}`,
      );

      return stdout.trim() === "true";
    } catch {
      return false;
    } finally {
      // Always cleanup the ghost test container to restore server memory
      await execAsync(`docker rm -f ${testContainer}`).catch(() => {});
    }
  }

  async stopContainer(serviceId: string) {
    const containerName = `stackpilot-container-${serviceId}`;
    try {
      await execAsync(`docker stop ${containerName}`);
    } catch (e) {}
  }

  async getLogs(containerId: string): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(
        `docker logs --tail 100 ${containerId}`,
      );
      return stdout + stderr;
    } catch (e) {
      return "Log reading failed.";
    }
  }
}
