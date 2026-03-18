export class Login {
  static readonly type = '[Auth] Login';

  constructor(
    public username: string,
    public password: string
  ) {}
}

export class Logout {
  static readonly type = '[Auth] Logout';
}

export class FetchAuthUser {
  static readonly type = '[Auth] Fetch Auth User';
}

export class RefreshToken {
  static readonly type = '[Auth] Refresh Token';
}

export class Register {
  static readonly type = '[Auth] Register';

  constructor(
    public username: string,
    public email: string,
    public password: string
  ) {}
}

export class VerifyRegistrationOtp {
  static readonly type = '[Auth] Verify Registration OTP';

  constructor(
    public email: string,
    public otp: string
  ) {}
}

export class ResetPassword {
  static readonly type = '[Auth] Reset Password';

  constructor(
    public email: string
  ) {}
}

export class SetAuthUser {
  static readonly type = '[Auth] Set Auth User';

  constructor(
    public authUser: any
  ) {}
}

export class ClearAuthError {
  static readonly type = '[Auth] Clear Auth Error';
}

export class SetLoadingLogin {
  static readonly type = '[Auth] Set Loading Login';

  constructor(
    public isLoading: boolean
  ) {}
}
