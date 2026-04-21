-- CreateEnum
CREATE TYPE "SegmentType" AS ENUM ('DYNAMIC', 'FROZEN');

-- CreateEnum
CREATE TYPE "DeltaChangeType" AS ENUM ('ADDED', 'REMOVED');

-- CreateEnum
CREATE TYPE "EvaluationTriggerType" AS ENUM ('TRANSACTION', 'PROFILE_UPDATE', 'TIME_ADVANCE', 'DEPENDENCY_CHANGE', 'MANUAL_REFRESH', 'INITIAL_SEED');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "city" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Segment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SegmentType" NOT NULL,
    "ruleJson" JSONB NOT NULL,
    "lastEvaluatedAt" TIMESTAMP(3),
    "lastSnapshotVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Segment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SegmentDependency" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "dependsOnSegmentId" TEXT NOT NULL,

    CONSTRAINT "SegmentDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SegmentMembershipCurrent" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SegmentMembershipCurrent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SegmentDelta" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "fromVersion" INTEGER NOT NULL,
    "toVersion" INTEGER NOT NULL,
    "addedCount" INTEGER NOT NULL DEFAULT 0,
    "removedCount" INTEGER NOT NULL DEFAULT 0,
    "triggerType" "EvaluationTriggerType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SegmentDelta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SegmentDeltaItem" (
    "id" TEXT NOT NULL,
    "deltaId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "changeType" "DeltaChangeType" NOT NULL,
    "segmentId" TEXT,

    CONSTRAINT "SegmentDeltaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Transaction_customerId_idx" ON "Transaction"("customerId");

-- CreateIndex
CREATE INDEX "Transaction_occurredAt_idx" ON "Transaction"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Segment_name_key" ON "Segment"("name");

-- CreateIndex
CREATE INDEX "SegmentDependency_segmentId_idx" ON "SegmentDependency"("segmentId");

-- CreateIndex
CREATE INDEX "SegmentDependency_dependsOnSegmentId_idx" ON "SegmentDependency"("dependsOnSegmentId");

-- CreateIndex
CREATE UNIQUE INDEX "SegmentDependency_segmentId_dependsOnSegmentId_key" ON "SegmentDependency"("segmentId", "dependsOnSegmentId");

-- CreateIndex
CREATE INDEX "SegmentMembershipCurrent_segmentId_idx" ON "SegmentMembershipCurrent"("segmentId");

-- CreateIndex
CREATE INDEX "SegmentMembershipCurrent_customerId_idx" ON "SegmentMembershipCurrent"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "SegmentMembershipCurrent_segmentId_customerId_key" ON "SegmentMembershipCurrent"("segmentId", "customerId");

-- CreateIndex
CREATE INDEX "SegmentDelta_segmentId_idx" ON "SegmentDelta"("segmentId");

-- CreateIndex
CREATE INDEX "SegmentDelta_createdAt_idx" ON "SegmentDelta"("createdAt");

-- CreateIndex
CREATE INDEX "SegmentDeltaItem_deltaId_idx" ON "SegmentDeltaItem"("deltaId");

-- CreateIndex
CREATE INDEX "SegmentDeltaItem_customerId_idx" ON "SegmentDeltaItem"("customerId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentDependency" ADD CONSTRAINT "SegmentDependency_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentDependency" ADD CONSTRAINT "SegmentDependency_dependsOnSegmentId_fkey" FOREIGN KEY ("dependsOnSegmentId") REFERENCES "Segment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentMembershipCurrent" ADD CONSTRAINT "SegmentMembershipCurrent_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentMembershipCurrent" ADD CONSTRAINT "SegmentMembershipCurrent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentDelta" ADD CONSTRAINT "SegmentDelta_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentDeltaItem" ADD CONSTRAINT "SegmentDeltaItem_deltaId_fkey" FOREIGN KEY ("deltaId") REFERENCES "SegmentDelta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentDeltaItem" ADD CONSTRAINT "SegmentDeltaItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentDeltaItem" ADD CONSTRAINT "SegmentDeltaItem_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
