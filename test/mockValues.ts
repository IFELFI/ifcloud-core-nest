import {
  file,
  file_info,
  file_link,
  file_path,
  file_role,
  file_type,
  member as member_type,
  service_status,
  temp_file,
} from '@prisma/client';
import { SpecialContainerNameSchema } from '../src/schemas/file.schema';
import { StorageManageReply } from 'src/proto/storage_manager';

const randomToken = 'random_token';
const member: member_type = {
  id: 1,
  uuid_key: '6dce7429-3e38-45b3-9262-9c571ac798de',
};
const serviceStatus: service_status = {
  member_id: member.id,
  available: false,
  join_date: new Date(),
  update_date: new Date(),
};
const root: { file: file; path: file_path; role: file_role; info: file_info } =
  {
    file: {
      id: BigInt(1),
      file_key: '123e4567-e89b-12d3-a456-426614174001',
      type: file_type.container,
      file_name: SpecialContainerNameSchema.enum.root,
      owner_id: member.id,
    },
    path: {
      file_id: BigInt(1),
      path: [],
    },
    role: {
      file_id: BigInt(1),
      member_id: member.id,
      role: ['create', 'read', 'update', 'delete'],
    },
    info: {
      file_id: BigInt(1),
      create_date: new Date(),
      update_date: new Date(),
      byte_size: 0,
    },
  };
const trash: { file: file; path: file_path; role: file_role; info: file_info } =
  {
    file: {
      id: BigInt(2),
      file_key: '123e4567-e89b-12d3-a456-426614174002',
      type: file_type.container,
      file_name: SpecialContainerNameSchema.enum.trash,
      owner_id: member.id,
    },
    path: {
      file_id: BigInt(2),
      path: [root.file.id],
    },
    role: {
      file_id: BigInt(2),
      member_id: member.id,
      role: ['create', 'read', 'update', 'delete'],
    },
    info: {
      file_id: BigInt(2),
      create_date: new Date(),
      update_date: new Date(),
      byte_size: 0,
    },
  };
const home: { file: file; path: file_path; role: file_role; info: file_info } =
  {
    file: {
      id: BigInt(3),
      file_key: '123e4567-e89b-12d3-a456-426614174003',
      type: file_type.container,
      file_name: SpecialContainerNameSchema.enum.home,
      owner_id: member.id,
    },
    path: {
      file_id: BigInt(3),
      path: [root.file.id],
    },
    role: {
      file_id: BigInt(3),
      member_id: member.id,
      role: ['create', 'read', 'update', 'delete'],
    },
    info: {
      file_id: BigInt(3),
      create_date: new Date(),
      update_date: new Date(),
      byte_size: 0,
    },
  };
const container: {
  file: file;
  path: file_path;
  role: file_role;
  info: file_info;
} = {
  file: {
    id: BigInt(4),
    file_key: '123e4567-e89b-12d3-a456-426614174004',
    type: file_type.container,
    file_name: 'container',
    owner_id: member.id,
  },
  path: {
    file_id: BigInt(4),
    path: [root.file.id, home.file.id],
  },
  role: {
    file_id: BigInt(4),
    member_id: member.id,
    role: ['create', 'read', 'update', 'delete'],
  },
  info: {
    file_id: BigInt(4),
    create_date: new Date(),
    update_date: new Date(),
    byte_size: 0,
  },
};
const block: { file: file; path: file_path; role: file_role; info: file_info } =
  {
    file: {
      id: BigInt(5),
      file_key: '123e4567-e89b-12d3-a456-426614174005',
      type: file_type.block,
      file_name: 'file.txt',
      owner_id: member.id,
    },
    path: {
      file_id: BigInt(5),
      path: [root.file.id, home.file.id],
    },
    role: {
      file_id: BigInt(5),
      member_id: member.id,
      role: ['create', 'read', 'update', 'delete'],
    },
    info: {
      file_id: BigInt(5),
      create_date: new Date(),
      update_date: new Date(),
      byte_size: 100,
    },
  };
const link: {
  file: file;
  path: file_path;
  target: file_link;
  role: file_role;
  info: file_info;
} = {
  file: {
    id: BigInt(6),
    file_key: '123e4567-e89b-12d3-a456-426614174006',
    type: file_type.link,
    file_name: 'link.txt',
    owner_id: member.id,
  },
  path: {
    file_id: BigInt(6),
    path: [root.file.id, home.file.id],
  },
  target: {
    file_id: BigInt(6),
    target_id: trash.file.id,
  },
  role: {
    file_id: BigInt(6),
    member_id: member.id,
    role: ['create', 'read', 'update', 'delete'],
  },
  info: {
    file_id: BigInt(6),
    create_date: new Date(),
    update_date: new Date(),
    byte_size: 0,
  },
};

const tempFile: temp_file = {
  id: BigInt(1),
  file_key: block.file.file_key,
  file_name: block.file.file_name,
  parent_id: container.file.id,
  owner_id: member.id,
  byte_size: block.info.byte_size,
  create_date: new Date(),
};

const storageSuccessReply: StorageManageReply = {
  success: true,
  message: 'Success',
};
const chunkCount = 10;

const mockValues = {
  randomToken,
  member,
  serviceStatus,
  root,
  trash,
  home,
  container,
  block,
  link,
  tempFile,
  storageSuccessReply,
  chunkCount,
};

export default mockValues;
