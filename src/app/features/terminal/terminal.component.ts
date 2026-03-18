import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { User, USERS } from '../../core/fake-api/db.data';
import { CompaniesApiService, Company } from '../../core/services/companies-api.service';
import { InitializeEntityDialogComponent } from './dialogs/initialize-entity-dialog.component';
import { IssueSharesDialogComponent } from './dialogs/issue-shares-dialog.component';
import { EditEntityDialogComponent } from './dialogs/edit-entity-dialog.component';
import { LiquidateConfirmDialogComponent } from './dialogs/liquidate-confirm-dialog.component';
import { UserDialogComponent } from './dialogs/user-dialog.component';

@Component({
  selector: 'app-terminal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDialogModule,
    MatTableModule,
    MatSnackBarModule
  ],
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.scss']
})
export class TerminalComponent {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private readonly companiesApi = inject(CompaniesApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  
  companies: Company[] = [];
  users: User[] = [...USERS];
  searchTerm: string = '';
  userSearchTerm: string = '';

  get totalCompanies() {
    return this.companies.length;
  }
  
  displayedColumns: string[] = ['company', 'total', 'outstanding', 'available', 'price'];
  displayedUserColumns: string[] = ['name', 'email', 'role', 'actions'];

  constructor() {
    this.refreshCompanies();
  }

  private refreshCompanies() {
    this.companiesApi.getCompanies().subscribe({
      next: (companies) => {
        // Defer to next macrotask to avoid NG0100 in dev mode.
        setTimeout(() => {
          this.companies = companies;
          this.cdr.markForCheck();
        }, 0);
      },
      error: (err) => {
        const msg = err?.error ?? err?.message ?? 'Failed to load companies';
        this.snackBar.open(String(msg), 'Close', { duration: 5000 });
      }
    });
  }

  get filteredCompanies() {
    return this.companies.filter((c: Company) => 
      c.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
      c.ticker.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get filteredUsers() {
    return this.users.filter(u => 
      u.firstName.toLowerCase().includes(this.userSearchTerm.toLowerCase()) || 
      u.lastName.toLowerCase().includes(this.userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(this.userSearchTerm.toLowerCase())
    );
  }

  openInitializeEntity() {
    const dialogRef = this.dialog.open(InitializeEntityDialogComponent, {
      width: '500px',
      panelClass: 'premium-modal',
      maxWidth: '90vw',
      data: {
        existingTickers: this.companies.map((c: Company) => c.ticker),
        existingSectors: Array.from(new Set(this.companies.map((c: Company) => c.sector))).sort(),
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.companiesApi.createCompany({
          name: result.name,
          ticker: result.ticker,
          sector: result.sector,
          website: result.website,
          logoUrl: result.logoUrl,
          marketCap: result.marketCap,
          price: Number(result.price ?? 0),
        }).subscribe({
          next: () => {
            this.snackBar.open('Entity registered successfully', 'Close', { duration: 3000 });
            this.refreshCompanies();
          },
          error: (err) => {
            const msg = err?.error ?? err?.message ?? 'Create failed';
            this.snackBar.open(String(msg), 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  openIssueShares() {
    const dialogRef = this.dialog.open(IssueSharesDialogComponent, {
      width: '500px',
      panelClass: 'premium-modal',
      maxWidth: '90vw',
      data: { companies: this.companies }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const companyId = Number(result.companyId);
        const quantity = Number(result.quantity);
        this.companiesApi.issueShares(companyId, quantity).subscribe({
          next: () => {
            this.snackBar.open('Shares issued successfully', 'Close', { duration: 3000 });
            this.refreshCompanies();
          },
          error: (err) => {
            const msg = err?.error ?? err?.message ?? 'Issuance failed';
            this.snackBar.open(String(msg), 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  onEdit(company: Company) {
    const dialogRef = this.dialog.open(EditEntityDialogComponent, {
      width: '500px',
      panelClass: 'premium-modal',
      maxWidth: '90vw',
      data: { company }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.companiesApi.updateCompany(company.id, {
          name: result.name,
          sector: result.sector,
          marketCap: result.marketCap,
          price: Number(result.price ?? 0),
        }).subscribe({
          next: () => {
            this.snackBar.open('Entity updated successfully', 'Close', { duration: 3000 });
            this.refreshCompanies();
          },
          error: (err) => {
            const msg = err?.error ?? err?.message ?? 'Update failed';
            this.snackBar.open(String(msg), 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  onLiquidate(company: Company) {
    const dialogRef = this.dialog.open(LiquidateConfirmDialogComponent, {
      width: '500px',
      panelClass: 'premium-modal',
      maxWidth: '90vw',
      data: { company }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.companiesApi.deleteCompany(company.id).subscribe({
          next: () => {
            this.snackBar.open(`${company.name} liquidated`, 'Close', { duration: 3000 });
            this.refreshCompanies();
          },
          error: (err) => {
            const msg = err?.error ?? err?.message ?? 'Delete failed';
            this.snackBar.open(String(msg), 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  // USER MANAGEMENT
  openAddUser() {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '500px',
      panelClass: 'premium-modal',
      maxWidth: '90vw',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newUser: User = {
          ...result,
          id: Math.max(...this.users.map(u => u.id)) + 1,
          username: result.email,
          accessToken: `token-${Date.now()}`,
          refreshToken: `refresh-${Date.now()}`
        };
        this.users = [newUser, ...this.users];
        this.snackBar.open('User created successfully', 'Close', { duration: 3000 });
      }
    });
  }

  onEditUser(user: User) {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '500px',
      panelClass: 'premium-modal',
      maxWidth: '90vw',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.users = this.users.map(u => u.id === user.id ? { ...u, ...result } : u);
        this.snackBar.open('User updated successfully', 'Close', { duration: 3000 });
      }
    });
  }

  onDeleteUser(user: User) {
    if (confirm(`Are you sure you want to delete user ${user.firstName} ${user.lastName}?`)) {
      this.users = this.users.filter(u => u.id !== user.id);
      this.snackBar.open('User deleted', 'Close', { duration: 3000 });
    }
  }
}
