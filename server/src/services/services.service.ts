import { Injectable } from "@nestjs/common";

@Injectable()
export class ServicesService {
  findAll() {
    return {
      message: "This action returns all services",
      data: [],
    };
  }

  findOne(id: string) {
    return {
      message: `This action returns service with id: ${id}`,
      data: null,
    };
  }
}
