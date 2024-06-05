-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "cloud";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "member";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "temp";

-- CreateEnum
CREATE TYPE "public"."access_role" AS ENUM ('create', 'read', 'update', 'delete');

-- CreateEnum
CREATE TYPE "public"."resolution" AS ENUM ('res_240p', 'res_360p', 'res_480p', 'res_720p', 'res_1080p', 'res_1440p', 'res_2160p', 'res_4320p');

-- CreateTable
CREATE TABLE "cloud"."external_access" (
    "id" BIGSERIAL NOT NULL,
    "folder_id" BIGINT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "access_key_id" BIGINT,

    CONSTRAINT "pk_external_access" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cloud"."file_info" (
    "id" BIGSERIAL NOT NULL,
    "file_id" BIGINT NOT NULL,
    "uploader_id" INTEGER NOT NULL,
    "create_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "byte_size" INTEGER NOT NULL,

    CONSTRAINT "pk_file_info" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cloud"."files" (
    "id" BIGSERIAL NOT NULL,
    "parent_folder_id" BIGINT NOT NULL,
    "file_key" UUID NOT NULL,
    "file_name" VARCHAR(256) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pk_files" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cloud"."folder_info" (
    "id" BIGSERIAL NOT NULL,
    "folder_id" BIGINT NOT NULL,
    "create_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "owner_id" INTEGER NOT NULL,

    CONSTRAINT "pk_folder_info" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cloud"."folders" (
    "id" BIGSERIAL NOT NULL,
    "parent_folder_id" BIGINT,
    "folder_name" VARCHAR(256) NOT NULL,
    "folder_key" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "pk_folders" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cloud"."stream" (
    "id" BIGSERIAL NOT NULL,
    "file_id" BIGINT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "activated_resolutions" "public"."resolution"[],

    CONSTRAINT "stream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cloud"."user_role" (
    "user_id" INTEGER NOT NULL,
    "folder_id" BIGINT NOT NULL,
    "role" "public"."access_role"[],

    CONSTRAINT "pk_user_role" PRIMARY KEY ("user_id","folder_id")
);

-- CreateTable
CREATE TABLE "member"."users" (
    "id" SERIAL NOT NULL,
    "uuid_key" UUID NOT NULL,

    CONSTRAINT "pk_users" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temp"."temp_access_key" (
    "id" BIGSERIAL NOT NULL,
    "access_key" UUID NOT NULL DEFAULT gen_random_uuid(),
    "create_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiry_date" TIMESTAMPTZ(6) NOT NULL,
    "default_role" "public"."access_role"[] DEFAULT ARRAY['read']::"public"."access_role"[],

    CONSTRAINT "pk_temp_access_key" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temp"."temp_files" (
    "id" BIGSERIAL NOT NULL,
    "uploader_id" INTEGER NOT NULL,
    "temp_file_name" VARCHAR(256) NOT NULL,
    "file_key" UUID NOT NULL DEFAULT gen_random_uuid(),
    "create_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_chunks" INTEGER NOT NULL,

    CONSTRAINT "pk_temp_files" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uni_external_access" ON "cloud"."external_access"("folder_id");

-- CreateIndex
CREATE UNIQUE INDEX "uni_file_info" ON "cloud"."file_info"("file_id");

-- CreateIndex
CREATE UNIQUE INDEX "uni_file_key" ON "cloud"."files"("file_key");

-- CreateIndex
CREATE UNIQUE INDEX "uni_child_file_name" ON "cloud"."files"("file_name", "parent_folder_id");

-- CreateIndex
CREATE UNIQUE INDEX "uni_folder_info" ON "cloud"."folder_info"("folder_id");

-- CreateIndex
CREATE UNIQUE INDEX "uni_folder_key" ON "cloud"."folders"("folder_key");

-- CreateIndex
CREATE UNIQUE INDEX "uni_child_folder_name" ON "cloud"."folders"("parent_folder_id", "folder_name");

-- CreateIndex
CREATE UNIQUE INDEX "uni_stream" ON "cloud"."stream"("file_id");

-- CreateIndex
CREATE UNIQUE INDEX "uni_users" ON "member"."users"("uuid_key");

-- CreateIndex
CREATE UNIQUE INDEX "uni_access_key" ON "temp"."temp_access_key"("access_key");

-- CreateIndex
CREATE UNIQUE INDEX "uni_temp_file_name" ON "temp"."temp_files"("temp_file_name");

-- CreateIndex
CREATE UNIQUE INDEX "uni_file_key" ON "temp"."temp_files"("file_key");

-- AddForeignKey
ALTER TABLE "cloud"."external_access" ADD CONSTRAINT "fk_access_key_id" FOREIGN KEY ("access_key_id") REFERENCES "temp"."temp_access_key"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cloud"."external_access" ADD CONSTRAINT "fk_folder_id" FOREIGN KEY ("folder_id") REFERENCES "cloud"."folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cloud"."file_info" ADD CONSTRAINT "fk_file_id" FOREIGN KEY ("file_id") REFERENCES "cloud"."files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cloud"."file_info" ADD CONSTRAINT "fk_uploader_id" FOREIGN KEY ("uploader_id") REFERENCES "member"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cloud"."files" ADD CONSTRAINT "fk_parent_folder_id" FOREIGN KEY ("parent_folder_id") REFERENCES "cloud"."folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cloud"."folder_info" ADD CONSTRAINT "fk_folder_id" FOREIGN KEY ("folder_id") REFERENCES "cloud"."folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cloud"."folder_info" ADD CONSTRAINT "fk_owner_id" FOREIGN KEY ("owner_id") REFERENCES "member"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cloud"."folders" ADD CONSTRAINT "fk_parent_folder_id" FOREIGN KEY ("parent_folder_id") REFERENCES "cloud"."folders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cloud"."stream" ADD CONSTRAINT "fk_file_id" FOREIGN KEY ("file_id") REFERENCES "cloud"."files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cloud"."user_role" ADD CONSTRAINT "fk_folder_id" FOREIGN KEY ("folder_id") REFERENCES "cloud"."folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cloud"."user_role" ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "member"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "temp"."temp_files" ADD CONSTRAINT "fk_uploader_id" FOREIGN KEY ("uploader_id") REFERENCES "member"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

