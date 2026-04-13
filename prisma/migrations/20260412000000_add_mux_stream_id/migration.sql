-- AlterTable: ajoute muxStreamId nullable sur StreamingEvent
ALTER TABLE "StreamingEvent" ADD COLUMN "muxStreamId" TEXT;
