import { Controller, Post, Body, HttpCode, Logger } from "@nestjs/common";
import { ServicesService } from "./services.service";
import { prisma } from "../libs/prisma";

@Controller("services/webhooks")
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly servicesService: ServicesService) {}

  @Post("github")
  @HttpCode(200)
  async handleGithubWebhook(@Body() payload: Record<string, any>) {
    const ref = payload.ref as string | undefined;

    // Push events to branches usually look like "refs/heads/main"
    if (!ref || !ref.startsWith("refs/heads/")) {
      return { message: "Ignored: Not a recognized push to a branch" };
    }

    const branch = ref.replace("refs/heads/", "");

    // GitHub sends several URLs. We primarily support SSH or HTTPS cloning.
    const cloneUrl = payload.repository?.clone_url;
    const htmlUrl = payload.repository?.html_url;

    if (!cloneUrl && !htmlUrl) {
      return { message: "Ignored: No repository URL found in payload." };
    }

    // Sanitize by stripping trailing ".git" to standardize comparisons
    const searchUrls = [cloneUrl, htmlUrl]
      .filter((url) => !!url)
      .map((url) => url.replace(/\.git$/, ""));

    this.logger.log(
      `Received push event for ${searchUrls[0]} on branch ${branch}`,
    );

    // Query all services listening to this specific branch
    const matchingServices = await prisma.service.findMany({
      where: { branch: branch },
    });

    const targetServices = matchingServices.filter((service) => {
      const dbUrl = service.repoUrl.replace(/\.git$/, "");
      return searchUrls.includes(dbUrl);
    });

    if (targetServices.length === 0) {
      return {
        message:
          "Ignored: No registered StackPilot services track this repository and branch combination.",
      };
    }

    // Trigger deployment securely for all matching services
    for (const service of targetServices) {
      this.logger.log(
        `Triggering automated deployment for service ID: ${service.id}`,
      );
      // Passing the service owner ID implicitly to satisfy exactly the existing method signature
      await this.servicesService.createDeployment(service.userId, service.id);
    }

    return {
      message: `Successfully triggered deployment for ${targetServices.length} service(s).`,
    };
  }
}
