-- AlterTable
ALTER TABLE "services" ADD COLUMN     "branch" TEXT NOT NULL DEFAULT 'main',
ADD COLUMN     "internalPort" INTEGER NOT NULL DEFAULT 3000;

-- CreateTable
CREATE TABLE "environment_variables" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environment_variables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "environment_variables_serviceId_idx" ON "environment_variables"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "environment_variables_serviceId_key_key" ON "environment_variables"("serviceId", "key");

-- AddForeignKey
ALTER TABLE "environment_variables" ADD CONSTRAINT "environment_variables_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
