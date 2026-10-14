-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'AGENT', 'SALES_AGENT', 'EMERGENCY_TEAM');

-- DropIndex
DROP INDEX "User_roleId_idx";

-- DropIndex
DROP INDEX "User_tenantId_idx";

-- DropIndex
DROP INDEX "User_unitId_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "deletedAt",
DROP COLUMN "firstName",
DROP COLUMN "isActive",
DROP COLUMN "isDeleted",
DROP COLUMN "lastName",
DROP COLUMN "mobile",
DROP COLUMN "roleId",
DROP COLUMN "tenantId",
DROP COLUMN "unitId",
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'AGENT';

-- DropTable
DROP TABLE "AccountTransaction";

-- DropTable
DROP TABLE "Allocation";

-- DropTable
DROP TABLE "Approval";

-- DropTable
DROP TABLE "AutomationScore";

-- DropTable
DROP TABLE "City";

-- DropTable
DROP TABLE "Client";

-- DropTable
DROP TABLE "ClientService";

-- DropTable
DROP TABLE "Department";

-- DropTable
DROP TABLE "Enquiry";

-- DropTable
DROP TABLE "FollowUp";

-- DropTable
DROP TABLE "Location";

-- DropTable
DROP TABLE "Permission";

-- DropTable
DROP TABLE "Product";

-- DropTable
DROP TABLE "RefCounter";

-- DropTable
DROP TABLE "Role";

-- DropTable
DROP TABLE "RolePermission";

-- DropTable
DROP TABLE "Staff";

-- DropTable
DROP TABLE "Stock";

-- DropTable
DROP TABLE "Task";

-- DropTable
DROP TABLE "Tenant";

-- DropTable
DROP TABLE "Unit";

-- DropTable
DROP TABLE "VitalSign";

-- DropEnum
DROP TYPE "AllocationStatus";

-- DropEnum
DROP TYPE "AllocationType";

-- DropEnum
DROP TYPE "ApprovalStatus";

-- DropEnum
DROP TYPE "EnquiryStatus";

-- DropEnum
DROP TYPE "LegacyRole";

-- DropEnum
DROP TYPE "TaskStatus";

-- DropEnum
DROP TYPE "TransactionStatus";

-- DropEnum
DROP TYPE "TransactionType";

-- CreateTable
CREATE TABLE "Billing" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Billing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" UUID NOT NULL,
    "billingId" UUID NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "planName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "nextBilling" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calendar" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,

    CONSTRAINT "Calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" UUID NOT NULL,
    "calendarId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmTask" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "customerId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowAutomation" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerType" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "actionConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowAutomation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationTrigger" (
    "id" UUID NOT NULL,
    "workflowId" UUID NOT NULL,
    "targetId" TEXT,
    "status" TEXT NOT NULL,
    "executionLog" TEXT,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo");

-- CreateIndex
CREATE UNIQUE INDEX "Calendar_agentId_key" ON "Calendar"("agentId");

-- AddForeignKey
ALTER TABLE "Billing" ADD CONSTRAINT "Billing_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "Billing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calendar" ADD CONSTRAINT "Calendar_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "Calendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationTrigger" ADD CONSTRAINT "AutomationTrigger_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "WorkflowAutomation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

