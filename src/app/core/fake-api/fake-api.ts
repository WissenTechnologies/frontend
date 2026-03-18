import { HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

import { User, USERS, COMPANIES } from './db.data';

type RequestHandlers = Record<string, Record<string, () => HttpResponse<unknown>>>;

export class FakeApi {
  private usersDB = new UsersDB();
  private portfoliosDB = new PortfoliosDB();
  private stocksDB = new StocksDB();

  constructor(private request: HttpRequest<Record<string, unknown>>) {}

  handleRequest(): Observable<HttpResponse<unknown>> {
    const requestsMapHandlers: RequestHandlers = {
      POST: {
        '/api/auth/login': () => this.handleLogin(),
        '/api/auth/register': () => this.handleRegister(),
        '/api/auth/reset-password': () => this.handleResetPassword(),
        '/api/portfolios': () => this.handleCreatePortfolio(),
      },
      PUT: {
        '/api/portfolios/:id': () => this.handleUpdatePortfolio(),
      },
      DELETE: {
        '/api/portfolios/:id': () => this.handleDeletePortfolio(),
      },
      GET: {
        '/api/auth/logout': () => this.handleLogout(),
        '/api/users/me': () => this.handleMe(),
        '/api/stocks': () => this.handleGetStocks(),
        '/api/portfolios': () => this.handleGetPortfolios(),
      },
    };

    const { method, url } = this.request;
    const handler = requestsMapHandlers[method][url];

    if (handler) {
      const response = handler();
      return response.status < 400 ? of(response) : throwError(() => response);
    }

    return throwError(() => this.respond400Error(`Cannot ${method} ${url}`));
  }

  private handleLogin(): HttpResponse<unknown> {
    const { body } = this.request;
    if (!body) return this.respond400Error();

    // validate grant type
    const grantType = body['grant_type'];
    if (!grantType) return this.respond400Error('Grant type is missing');

    if (grantType === 'password') {
      return this.handleLoginPassword(body);
    } else if (grantType === 'refresh_token') {
      return this.handleLoginRefreshToken(body);
    }

    return this.respond400Error('Grant type is incorrect');
  }

  private handleLoginPassword(body: Record<string, unknown>): HttpResponse<unknown> {
    // handle login for password grant type
    const { username, password } = body;
    if (!username || !password) {
      return this.respond400Error('Username or password is missing');
    }

    const user = this.usersDB.findByUsernameAndPassword(
      username as string,
      password as string
    );

    if (!user) return this.respond400Error('Username or password is incorrect');

    return this.respondSuccess({
      token_type: 'Bearer',
      expires_in: 86399,
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
    });
  }

  private handleLoginRefreshToken(body: Record<string, unknown>): HttpResponse<unknown> {
    // handle login for refresh token grant type
    const refreshToken = body['refresh_token'];
    if (!refreshToken) return this.respond400Error('Refresh token is missing');

    const user = this.usersDB.findByRefreshToken(refreshToken as string);
    if (!user) return this.respond400Error('Refresh token is incorrect');

    return this.respondSuccess({
      token_type: 'Bearer',
      expires_in: 86399,
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
    });
  }

  private handleMe(): HttpResponse<unknown> {
    const { headers } = this.request;
    const accessToken = headers.get('Authorization')?.split(' ')[1];
    if (!accessToken) return this.respond400Error('Access token is missing');

    const user = this.usersDB.findByAccessToken(accessToken);
    if (!user) return this.respond400Error('Access token is incorrect');

    return this.respondSuccess({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
  }

  private handleRegister(): HttpResponse<unknown> {
    const { body } = this.request;
    if (!body) return this.respond400Error();

    const { firstName, lastName, email, password } = body;
    if (!firstName || !lastName || !email || !password) {
      return this.respond400Error('All fields are required');
    }

    // Check if user already exists
    const existingUser = this.usersDB.findByEmail(email as string);
    if (existingUser) {
      return this.respond400Error('User with this email already exists');
    }

    // Create new user
    const newUser = this.usersDB.createUser({
      firstName: firstName as string,
      lastName: lastName as string,
      email: email as string,
      password: password as string,
      role: 'user' // Default role for new registrations
    });

    return this.respondSuccess({
      token_type: 'Bearer',
      expires_in: 86399,
      access_token: newUser.accessToken,
      refresh_token: newUser.refreshToken,
    });
  }

  private handleResetPassword(): HttpResponse<unknown> {
    const { body } = this.request;
    if (!body) return this.respond400Error();

    const { email } = body;
    if (!email) {
      return this.respond400Error('Email is required');
    }

    // Check if user exists
    const user = this.usersDB.findByEmail(email as string);
    if (!user) {
      return this.respond400Error('User with this email does not exist');
    }

    // In a real app, this would send an email
    // For demo purposes, we'll just return success
    return this.respondSuccess({ message: 'Password reset email sent' });
  }

  private handleLogout(): HttpResponse<unknown> {
    return this.respondSuccess({});
  }

  private handleGetStocks(): HttpResponse<unknown> {
    return this.respondSuccess(this.stocksDB.findAll());
  }

  private handleGetPortfolios(): HttpResponse<unknown> {
    return this.respondSuccess(this.portfoliosDB.findAll());
  }

  private handleCreatePortfolio(): HttpResponse<unknown> {
    const { body } = this.request;
    if (!body) return this.respond400Error();

    const { name, availableCash } = body;
    if (!name || availableCash === undefined) {
      return this.respond400Error('Name and availableCash are required');
    }

    const newPortfolio = this.portfoliosDB.create(name as string, Number(availableCash));
    return this.respondSuccess(newPortfolio);
  }

  private handleUpdatePortfolio(): HttpResponse<unknown> {
    const { url, body } = this.request;
    if (!body) return this.respond400Error();

    const id = parseInt(url?.split('/').pop() || '0');
    const { name, availableCash } = body;
    if (!name || availableCash === undefined) {
      return this.respond400Error('Name and availableCash are required');
    }

    const updatedPortfolio = this.portfoliosDB.update(id, name as string, Number(availableCash));
    if (!updatedPortfolio) {
      return this.respond400Error('Portfolio not found');
    }

    return this.respondSuccess(updatedPortfolio);
  }

  private handleDeletePortfolio(): HttpResponse<unknown> {
    const { url } = this.request;
    const id = parseInt(url?.split('/').pop() || '0');
    
    this.portfoliosDB.delete(id);
    return this.respondSuccess({});
  }

  private respondSuccess(body: unknown): HttpResponse<unknown> {
    const { headers, url } = this.request;
    return new HttpResponse({ status: 200, headers, url, body });
  }

  private respond400Error(message = 'Bad request'): HttpResponse<unknown> {
    return new HttpResponse({
      status: 400,
      body: { message },
    });
  }
}

class UsersDB {
  findAll() {
    return USERS;
  }

  findByUsernameAndPassword(username: string, password: string) {
    return this.findAll().find(
      user => user.username === username && user.password === password
    );
  }

  findByEmail(email: string) {
    return this.findAll().find(user => user.email === email);
  }

  findByAccessToken(accessToken: string) {
    return this.findAll().find(user => user.accessToken === accessToken);
  }

  findByRefreshToken(refreshToken: string) {
    return this.findAll().find(user => user.refreshToken === refreshToken);
  }

  createUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
  }) {
    const newUser: User = {
      id: Math.max(...this.findAll().map(u => u.id)) + 1,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.role,
      username: userData.email, // Use email as username for simplicity
      password: userData.password,
      accessToken: `valid-jwt-access-token-${Date.now()}`,
      refreshToken: `valid-jwt-refresh-token-${Date.now()}`,
    };

    USERS.push(newUser);
    return newUser;
  }
}

class StocksDB {
  findAll() {
    return COMPANIES.map(company => ({
      symbol: company.ticker,
      name: company.name,
      currentPrice: company.price,
      dayHigh: company.price * 1.05,
      dayLow: company.price * 0.95,
      volume: Math.floor(Math.random() * 10000000).toString(),
      marketCap: company.marketCap
    }));
  }

  findBySymbol(symbol: string) {
    return this.findAll().find(stock => stock.symbol === symbol);
  }
}

class PortfoliosDB {
  private portfolios = [
    {
      id: 1,
      name: 'Growth Portfolio',
      availableCash: 50000,
      holdings: [
        { symbol: 'AAPL', quantity: 100, averagePrice: 175.50 },
        { symbol: 'MSFT', quantity: 50, averagePrice: 350.00 },
        { symbol: 'GOOGL', quantity: 30, averagePrice: 140.00 }
      ]
    },
    {
      id: 2,
      name: 'Tech Portfolio',
      availableCash: 25000,
      holdings: [
        { symbol: 'NVDA', quantity: 25, averagePrice: 600.00 },
        { symbol: 'TSLA', quantity: 40, averagePrice: 230.00 },
        { symbol: 'META', quantity: 20, averagePrice: 450.00 }
      ]
    },
    {
      id: 3,
      name: 'Balanced Portfolio',
      availableCash: 75000,
      holdings: [
        { symbol: 'JPM', quantity: 75, averagePrice: 170.00 },
        { symbol: 'BRK.B', quantity: 60, averagePrice: 360.00 },
        { symbol: 'NFLX', quantity: 15, averagePrice: 480.00 }
      ]
    }
  ];

  findAll() {
    return this.portfolios;
  }

  findById(id: number) {
    return this.portfolios.find(p => p.id === id);
  }

  create(name: string, initialCash: number) {
    const newPortfolio = {
      id: Math.max(...this.portfolios.map(p => p.id)) + 1,
      name,
      availableCash: initialCash,
      holdings: []
    };
    this.portfolios.push(newPortfolio);
    return newPortfolio;
  }

  update(id: number, name: string, availableCash: number) {
    const portfolio = this.findById(id);
    if (portfolio) {
      portfolio.name = name;
      portfolio.availableCash = availableCash;
    }
    return portfolio;
  }

  delete(id: number) {
    const index = this.portfolios.findIndex(p => p.id === id);
    if (index !== -1) {
      this.portfolios.splice(index, 1);
    }
  }
}
