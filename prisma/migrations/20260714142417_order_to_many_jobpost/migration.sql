-- DropIndex
DROP INDEX "orders_jobPostId_key";

-- CreateIndex
CREATE INDEX "orders_jobPostId_idx" ON "orders"("jobPostId");
