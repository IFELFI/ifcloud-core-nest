export interface ValidRequestQuery {
  uuidKey: string;
  memberId?: number;
}

export interface UserRequestQuery extends ValidRequestQuery {
  memberId: number;
}
