/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from "@nestjs/common";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);

@Injectable()
export class GitService {
  private readonly workspaceDir = path.join(process.cwd(), "workspace");

  constructor() {
    this.ensureWorkspace().catch(console.error);
  }

  private async ensureWorkspace() {
    try {
      await fs.mkdir(this.workspaceDir, { recursive: true });
    } catch (err) {
      // Ignore
    }
  }

  async cloneRepo(
    repoUrl: string,
    serviceId: string,
    branch: string = "main",
  ): Promise<string> {
    const targetDir = path.join(this.workspaceDir, serviceId);
    // Clean up if it exists
    await fs.rm(targetDir, { recursive: true, force: true }).catch(() => {});
    // Clone repository
    await execAsync(`git clone -b ${branch} ${repoUrl} ${targetDir}`);
    return targetDir;
  }
}
