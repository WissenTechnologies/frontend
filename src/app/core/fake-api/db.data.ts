export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'user';
  username: string;
  password: string;
  accessToken: string;
  refreshToken: string;
}

export const USERS: User[] = [
  {
    id: 1,
    firstName: 'Admin',
    lastName: 'Demo',
    email: 'admin@voldemort.com',
    role: 'admin',
    username: 'admin',
    password: 'demo',
    accessToken: 'valid-jwt-access-token-1',
    refreshToken: 'valid-jwt-refresh-token-1',
  },
  {
    id: 2,
    firstName: 'Nikos',
    lastName: 'Anifantis',
    email: 'nikos@voldemort.com',
    role: 'user',
    username: 'nikos',
    password: '1234',
    accessToken: 'valid-jwt-access-token-2',
    refreshToken: 'valid-jwt-refresh-token-2',
  },
  {
    id: 3,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@voldemort.com',
    role: 'user',
    username: 'john',
    password: '4321',
    accessToken: 'valid-jwt-access-token-3',
    refreshToken: 'valid-jwt-refresh-token-3',
  },
  {
    id: 4,
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'sarah@voldemort.com',
    role: 'user',
    username: 'sarah',
    password: 'password123',
    accessToken: 'valid-jwt-access-token-4',
    refreshToken: 'valid-jwt-refresh-token-4',
  },
  {
    id: 5,
    firstName: 'Elena',
    lastName: 'Fisher',
    email: 'elena@voldemort.com',
    role: 'user',
    username: 'elena',
    password: 'password123',
    accessToken: 'valid-jwt-access-token-5',
    refreshToken: 'valid-jwt-refresh-token-5',
  },
  {
    id: 6,
    firstName: 'Admin',
    lastName: 'Two',
    email: 'admin2@voldemort.com',
    role: 'admin',
    username: 'admin2',
    password: 'demo',
    accessToken: 'valid-jwt-access-token-6',
    refreshToken: 'valid-jwt-refresh-token-6',
  },
];
export interface Company {
  id: number;
  name: string;
  ticker: string;
  sector: string;
  website?: string;
  logoUrl?: string;
  marketCap: string;
  price: number;
  totalShares: string;
  outstandingShares: string;
  availableShares: string;
}

export const COMPANIES: Company[] = [
  { id: 1, name: 'Tesla Inc.', ticker: 'TSLA', sector: 'Consumer Discretionary', marketCap: '798.88B', price: 252.35, totalShares: '3.17B', outstandingShares: '3.14B', availableShares: '228M' },
  { id: 2, name: 'Apple Inc.', ticker: 'AAPL', sector: 'Information Technology', marketCap: '2.98T', price: 189.87, totalShares: '15.6B', outstandingShares: '15.3B', availableShares: '300M' },
  { id: 3, name: 'Microsoft Corp.', ticker: 'MSFT', sector: 'Information Technology', marketCap: '2.75T', price: 374.51, totalShares: '7.43B', outstandingShares: '7.35B', availableShares: '80M' },
  { id: 4, name: 'Amazon.com Inc.', ticker: 'AMZN', sector: 'Consumer Discretionary', marketCap: '1.89T', price: 183.75, totalShares: '10.3B', outstandingShares: '10.1B', availableShares: '150M' },
  { id: 5, name: 'NVIDIA Corp.', ticker: 'NVDA', sector: 'Information Technology', marketCap: '1.65T', price: 674.22, totalShares: '2.47B', outstandingShares: '2.45B', availableShares: '20M' },
  { id: 6, name: 'Meta Platforms Inc.', ticker: 'META', sector: 'Communication Services', marketCap: '1.24T', price: 485.58, totalShares: '2.56B', outstandingShares: '2.53B', availableShares: '30M' },
  { id: 7, name: 'Netflix Inc.', ticker: 'NFLX', sector: 'Communication Services', marketCap: '228.88B', price: 525.40, totalShares: '0.44B', outstandingShares: '0.43B', availableShares: '3M' },
  { id: 8, name: 'Alphabet Inc.', ticker: 'GOOGL', sector: 'Communication Services', marketCap: '1.89T', price: 151.25, totalShares: '12.70B', outstandingShares: '12.50B', availableShares: '200M' },
  { id: 9, name: 'Berkshire Hathaway', ticker: 'BRK.B', sector: 'Financials', marketCap: '869.88B', price: 378.99, totalShares: '2.30B', outstandingShares: '2.28B', availableShares: '20M' },
  { id: 10, name: 'JPMorgan Chase & Co.', ticker: 'JPM', sector: 'Financials', marketCap: '537.88B', price: 185.22, totalShares: '2.92B', outstandingShares: '2.90B', availableShares: '20M' },
];
