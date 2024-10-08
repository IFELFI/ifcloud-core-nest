-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "file";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "member";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "temp_file";

-- CreateEnum
CREATE TYPE "public"."access_role" AS ENUM ('create', 'read', 'update', 'delete');

-- CreateEnum
CREATE TYPE "public"."file_type" AS ENUM ('container', 'block', 'link');

-- CreateTable
CREATE TABLE "file"."file" (
    "id" BIGSERIAL NOT NULL,
    "file_key" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "public"."file_type" NOT NULL DEFAULT 'block',
    "file_name" VARCHAR(256) NOT NULL,
    "owner_id" INTEGER NOT NULL,

    CONSTRAINT "pk_file" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file"."file_info" (
    "file_id" BIGINT NOT NULL,
    "create_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "byte_size" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pk_file_info" PRIMARY KEY ("file_id")
);

-- CreateTable
CREATE TABLE "file"."file_role" (
    "member_id" INTEGER NOT NULL,
    "file_id" BIGINT NOT NULL,
    "role" "public"."access_role"[] DEFAULT ARRAY[]::"public"."access_role"[],

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

-- CreateTable
CREATE TABLE "file"."file_closure" (
    "parent_id" BIGINT NOT NULL,
    "child_id" BIGINT NOT NULL,

    CONSTRAINT "pk_file_closure" PRIMARY KEY ("parent_id","child_id")
);

-- CreateTable
CREATE TABLE "temp_file"."temp_file" (
    "id" BIGSERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "file_key" UUID NOT NULL DEFAULT gen_random_uuid(),
    "file_name" VARCHAR(256) NOT NULL,
    "byte_size" INTEGER NOT NULL DEFAULT 0,
    "create_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parent_id" BIGINT NOT NULL,

    CONSTRAINT "pk_temp_file" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uni_file_file_key" ON "file"."file"("file_key");

-- CreateIndex
CREATE UNIQUE INDEX "uni_member_uuid_key" ON "member"."member"("uuid_key");

-- CreateIndex
CREATE UNIQUE INDEX "uni_child_id" ON "file"."file_closure"("child_id");

-- CreateIndex
CREATE UNIQUE INDEX "uni_file_key" ON "temp_file"."temp_file"("file_key");

-- AddForeignKey
ALTER TABLE "file"."file" ADD CONSTRAINT "fk_owner_id" FOREIGN KEY ("owner_id") REFERENCES "member"."member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file"."file_info" ADD CONSTRAINT "fk_file_id" FOREIGN KEY ("file_id") REFERENCES "file"."file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file"."file_role" ADD CONSTRAINT "fk_file_id" FOREIGN KEY ("file_id") REFERENCES "file"."file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file"."file_role" ADD CONSTRAINT "fk_member_id" FOREIGN KEY ("member_id") REFERENCES "member"."member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member"."service_status" ADD CONSTRAINT "fk_member_id" FOREIGN KEY ("member_id") REFERENCES "member"."member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file"."file_closure" ADD CONSTRAINT "fk_child_id" FOREIGN KEY ("child_id") REFERENCES "file"."file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file"."file_closure" ADD CONSTRAINT "fk_parent_id" FOREIGN KEY ("parent_id") REFERENCES "file"."file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temp_file"."temp_file" ADD CONSTRAINT "fk_owner_id" FOREIGN KEY ("owner_id") REFERENCES "member"."member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temp_file"."temp_file" ADD CONSTRAINT "fk_parent_id" FOREIGN KEY ("parent_id") REFERENCES "file"."file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

