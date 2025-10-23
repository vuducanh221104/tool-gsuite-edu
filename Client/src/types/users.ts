export interface DirectoryUserName {
  givenName?: string;
  familyName?: string;
}

export interface DirectoryUser {
  id?: string;
  primaryEmail: string;
  name?: DirectoryUserName;
}

export interface ListUsersResponse {
  users: DirectoryUser[];
  nextPageToken?: string | null;
}
