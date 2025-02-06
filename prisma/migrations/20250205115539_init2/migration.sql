-- AlterEnum
ALTER TYPE "CollectionStatus" ADD VALUE 'REFUSED';

-- CreateTable
CREATE TABLE "customer_risk_history" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_risk_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "customer_risk_history" ADD CONSTRAINT "customer_risk_history_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
