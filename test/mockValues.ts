import {
  file,
  file_closure,
  file_info,
  file_role,
  file_type,
  member as member_type,
  temp_file,
} from '@prisma/client';
import { SpecialContainerNameSchema } from '../src/schemas/file.schema';

const member: member_type = {
  id: 1,
  uuid_key: '6dce7429-3e38-45b3-9262-9c571ac798de',
};
const root: file = {
  id: BigInt(1),
  file_key: '123e4567-e89b-12d3-a456-426614174001',
  type: file_type.container,
  file_name: SpecialContainerNameSchema.enum.root,
  owner_id: member.id,
};
const trash: file = {
  id: BigInt(2),
  file_key: '123e4567-e89b-12d3-a456-426614174002',
  type: file_type.container,
  file_name: SpecialContainerNameSchema.enum.trash,
  owner_id: member.id,
};
const container: file = {
  id: BigInt(3),
  file_key: '123e4567-e89b-12d3-a456-426614174000',
  type: file_type.container,
  file_name: SpecialContainerNameSchema.enum.home,
  owner_id: 1,
};
const block: file = {
  id: BigInt(4),
  file_key: '123e4567-e89b-12d3-a456-426614174001',
  type: file_type.block,
  file_name: 'file.txt',
  owner_id: member.id,
};
const fileInfo: file_info = {
  file_id: block.id,
  create_date: new Date(),
  update_date: new Date(),
  byte_size: 1000,
};
const fileRole: file_role = {
  file_id: block.id,
  member_id: member.id,
  role: ['create', 'read', 'update', 'delete'],
};
const tempFile: temp_file = {
  id: BigInt(1),
  file_key: block.file_key,
  file_name: block.file_name,
  parent_id: container.id,
  owner_id: member.id,
  byte_size: fileInfo.byte_size,
  create_date: new Date(),
};
const fileClosure: file_closure = {
  parent_id: container.id,
  child_id: block.id,
};

const mockValues = {
  member,
  root,
  trash,
  container,
  block,
  fileInfo,
  fileRole,
  tempFile,
  fileClosure,
};

export default mockValues;
