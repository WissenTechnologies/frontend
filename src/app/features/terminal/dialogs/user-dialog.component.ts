import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { User } from '../../../core/fake-api/db.data';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <div class="p-6 bg-[#0a0a0a] text-white">
      <h2 mat-dialog-title class="text-2xl font-bold uppercase tracking-widest text-white mb-6">
        {{ data.user ? 'Edit User' : 'Add New User' }}
      </h2>
      
      <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="grid gap-4">
        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline" class="premium-field">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName">
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="premium-field">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="premium-field">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email">
        </mat-form-field>

        <mat-form-field appearance="outline" class="premium-field">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            <mat-option value="user">USER</mat-option>
            <mat-option value="admin">ADMIN</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="premium-field" *ngIf="!data.user">
          <mat-label>Password</mat-label>
          <input matInput formControlName="password" type="password">
        </mat-form-field>

        <div class="flex justify-end gap-4 mt-8">
          <button type="button" mat-button (click)="onCancel()" class="text-gray-400 hover:text-white uppercase tracking-widest text-[10px] font-bold" style="font-family: sans-serif-condensed, 'Roboto Condensed', 'Helvetica Neue Condensed', 'Arial Narrow', sans-serif;">Cancel</button>
          <button type="submit" mat-flat-button color="primary" [disabled]="userForm.invalid" class="bg-indigo-600 uppercase tracking-widest font-black px-10 rounded-sm" style="font-family: sans-serif-condensed, 'Roboto Condensed', 'Helvetica Neue Condensed', 'Arial Narrow', sans-serif;">
            {{ data.user ? 'UPDATE USER' : 'CREATE USER' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host { display: block; border-radius: 2px; }
    .premium-field { 
      width: 100%; 
      ::ng-deep .mat-mdc-text-field-wrapper {
        background-color: #111 !important;
      }
      ::ng-deep .mat-mdc-input-element {
        color: #fff !important;
        font-weight: 700 !important;
      }
    }
  `]
})
export class UserDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<UserDialogComponent>);
  protected data = inject<{ user?: User }>(MAT_DIALOG_DATA);

  userForm: FormGroup = this.fb.group({
    firstName: [this.data.user?.firstName || '', [Validators.required]],
    lastName: [this.data.user?.lastName || '', [Validators.required]],
    email: [this.data.user?.email || '', [Validators.required, Validators.email]],
    role: [this.data.user?.role || 'user', [Validators.required]],
    password: ['', this.data.user ? [] : [Validators.required, Validators.minLength(4)]]
  });

  onSubmit() {
    if (this.userForm.valid) {
      this.dialogRef.close(this.userForm.value);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
