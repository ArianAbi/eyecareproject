-- DropForeignKey
ALTER TABLE "PaymentAttempt" DROP CONSTRAINT "PaymentAttempt_invoiceId_fkey";

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
