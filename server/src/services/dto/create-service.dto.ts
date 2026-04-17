import { IsString, IsUrl, IsOptional, IsNumber, Min } from "class-validator";

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsUrl()
  repoUrl: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}
