-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "primaryContactId" INTEGER NOT NULL,
    "emails" TEXT[],
    "phoneNumbers" TEXT[],
    "secondaryContactIds" INTEGER[],

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_primaryContactId_key" ON "Customer"("primaryContactId");
