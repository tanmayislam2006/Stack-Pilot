import { Module } from "@nestjs/common";
import { ServicesController } from "./services.controller";
import { ServicesService } from "./services.service";
import { GitService } from "./git.service";
import { DockerService } from "./docker.service";
import { PortService } from "./port.service";

@Module({
  controllers: [ServicesController],
  providers: [ServicesService, GitService, DockerService, PortService],
})
export class ServicesModule {}
