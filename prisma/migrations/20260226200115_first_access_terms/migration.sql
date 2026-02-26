-- AlterTable
ALTER TABLE "User" ADD COLUMN     "acceptedTermsAt" TIMESTAMP(3),
ADD COLUMN     "hasAcceptedTerms" BOOLEAN NOT NULL DEFAULT false;
