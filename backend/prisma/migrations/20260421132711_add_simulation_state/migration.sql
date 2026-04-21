-- CreateTable
CREATE TABLE "SimulationState" (
    "id" TEXT NOT NULL,
    "currentTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationState_pkey" PRIMARY KEY ("id")
);
