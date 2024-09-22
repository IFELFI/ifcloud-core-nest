import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, timeout } from 'rxjs';
import { MergeChunksRequestQuery } from 'src/interfaces/request';

@Injectable()
export class StorageService {
  constructor(
    @Inject('STORAGE_SERVICE') private readonly client: ClientProxy,
  ) {}

  onApplicationBootstrap() {
    this.client.connect();
  }

  /**
   * Merge chunks of a file
   * @param uuidKey - The UUID key of the file
   * @returns Status of the merge operation
   */
  mergeChunks(uuidKey: string): Observable<string> {
    const requestData: MergeChunksRequestQuery = {
      file_key: uuidKey,
      total_chunks: 1,
    };

    return this.client
      .send<string>(
        {
          target: 'storage',
          cmd: 'merge',
        },
        requestData,
      )
      .pipe(timeout(5000));
  }
}
