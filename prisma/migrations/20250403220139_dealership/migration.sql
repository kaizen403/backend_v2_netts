-- CreateTable
CREATE TABLE "Dealership" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "phno" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Dealership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dealership_email_key" ON "Dealership"("email");
