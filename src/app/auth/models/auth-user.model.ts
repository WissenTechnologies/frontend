export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'user';
}
