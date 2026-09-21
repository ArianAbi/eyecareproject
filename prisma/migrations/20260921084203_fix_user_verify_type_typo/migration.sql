/*
  Warnings:

  - The values [VEIFIED] on the enum `UserVerifyType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserVerifyType_new" AS ENUM ('UNVERIFIED', 'WAITING_FOR_APPROVAL', 'VERIFIED', 'REJECTED');
ALTER TABLE "public"."User" ALTER COLUMN "userStatus" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "userStatus" TYPE "UserVerifyType_new" USING ("userStatus"::text::"UserVerifyType_new");
ALTER TYPE "UserVerifyType" RENAME TO "UserVerifyType_old";
ALTER TYPE "UserVerifyType_new" RENAME TO "UserVerifyType";
DROP TYPE "public"."UserVerifyType_old";
ALTER TABLE "User" ALTER COLUMN "userStatus" SET DEFAULT 'UNVERIFIED';
COMMIT;
