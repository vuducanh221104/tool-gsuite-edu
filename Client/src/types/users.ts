export interface DirectoryUserName {
  givenName?: string;
  familyName?: string;
  fullName?: string;
}

export interface DirectoryUser {
  id?: string;
  primaryEmail: string;
  name?: DirectoryUserName;
  isAdmin?: boolean;
  isDelegatedAdmin?: boolean;
  suspended?: boolean;
  orgUnitPath?: string;
  creationTime?: string;
  lastLoginTime?: string;
  customerId?: string;
  recoveryEmail?: string;
  recoveryPhone?: string;
  isMailboxSetup?: boolean;
  changePasswordAtNextLogin?: boolean;
}

export interface ListUsersResponse {
  users: DirectoryUser[];
  nextPageToken?: string | null;
}
