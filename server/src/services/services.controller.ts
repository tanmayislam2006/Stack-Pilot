import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { ServicesService } from "./services.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetUser } from "../auth/decorators/get-user.decorator";

@Controller("services")
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  create(
    @GetUser("userId") userId: string,
    @Body() createServiceDto: CreateServiceDto,
  ) {
    return this.servicesService.create(userId, createServiceDto);
  }

  @Get()
  findAll(@GetUser("userId") userId: string) {
    return this.servicesService.findAll(userId);
  }

  @Get(":id")
  findOne(@GetUser("userId") userId: string, @Param("id") id: string) {
    return this.servicesService.findOne(userId, id);
  }

  @Delete(":id")
  remove(@GetUser("userId") userId: string, @Param("id") id: string) {
    return this.servicesService.remove(userId, id);
  }

  @Post(":id/deploy")
  deploy(@GetUser("userId") userId: string, @Param("id") id: string) {
    return this.servicesService.createDeployment(userId, id);
  }

  @Get(":id/deployments")
  getDeployments(@GetUser("userId") userId: string, @Param("id") id: string) {
    return this.servicesService.getDeployments(userId, id);
  }
}
