import {
  IsString,
  IsUrl,
  IsOptional,
  IsNumber,
  Min,
  IsObject,
} from "class-validator";

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsUrl()
  repoUrl: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  internalPort?: number;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsObject()
  envVars?: Record<string, string>;
}
