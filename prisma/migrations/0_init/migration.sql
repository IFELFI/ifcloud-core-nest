-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "file";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "member";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."access_role" AS ENUM ('create', 'read', 'update', 'delete');

-- CreateEnum
CREATE TYPE "public"."file_type" AS ENUM ('container', 'block', 'link');

-- CreateTable
CREATE TABLE "file"."file" (
    "id" BIGSERIAL NOT NULL,
    "file_key" UUID NOT NULL DEFAULT gen_random_uuid(),
    "file_name" VARCHAR(256)[],
    "type" "public"."file_type" NOT NULL DEFAULT 'block',

    CONSTRAINT "pk_file" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file"."file_info" (
    "file_id" BIGINT NOT NULL,
    "owner_id" INTEGER,
    "create_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_file_info" PRIMARY KEY ("file_id")
);

-- CreateTable
CREATE TABLE "file"."file_role" (
    "member_id" INTEGER NOT NULL,
    "file_id" BIGINT NOT NULL,
    "role" "public"."access_role" NOT NULL DEFAULT 'read',

    CONSTRAINT "pk_file_role" PRIMARY KEY ("member_id","file_id")
);

-- CreateTable
CREATE TABLE "member"."member" (
    "id" SERIAL NOT NULL,
    "uuid_key" UUID NOT NULL,

    CONSTRAINT "pk_member" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member"."service_status" (
    "member_id" INTEGER NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT false,
    "join_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_service_status" PRIMARY KEY ("member_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uni_file_file_key" ON "file"."file"("file_key");

-- CreateIndex
CREATE UNIQUE INDEX "uni_member_uuid_key" ON "member"."member"("uuid_key");

-- AddForeignKey
ALTER TABLE "file"."file_info" ADD CONSTRAINT "fk_file_id" FOREIGN KEY ("file_id") REFERENCES "file"."file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file"."file_info" ADD CONSTRAINT "fk_owner_id" FOREIGN KEY ("owner_id") REFERENCES "member"."member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file"."file_role" ADD CONSTRAINT "fk_file_id" FOREIGN KEY ("file_id") REFERENCES "file"."file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file"."file_role" ADD CONSTRAINT "fk_member_id" FOREIGN KEY ("member_id") REFERENCES "member"."member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member"."service_status" ADD CONSTRAINT "fk_member_id" FOREIGN KEY ("member_id") REFERENCES "member"."member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

