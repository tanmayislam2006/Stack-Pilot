-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('IDLE', 'BUILDING', 'RUNNING', 'STOPPED', 'ERROR');

-- CreateEnum
CREATE TYPE "DeployStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ServiceStatus" NOT NULL DEFAULT 'IDLE',
    "containerId" TEXT,
    "port" INTEGER,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployments" (
    "id" TEXT NOT NULL,
    "status" "DeployStatus" NOT NULL DEFAULT 'PENDING',
    "logs" TEXT,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "services_name_idx" ON "services"("name");

-- CreateIndex
CREATE INDEX "services_status_idx" ON "services"("status");

-- CreateIndex
CREATE INDEX "services_port_idx" ON "services"("port");

-- CreateIndex
CREATE INDEX "deployments_serviceId_idx" ON "deployments"("serviceId");

-- CreateIndex
CREATE INDEX "deployments_status_idx" ON "deployments"("status");

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
