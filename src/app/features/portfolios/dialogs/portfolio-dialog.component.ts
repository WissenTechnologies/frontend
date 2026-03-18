import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-portfolio-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="p-6 bg-[#0a0a0a] text-white">
      <h2 mat-dialog-title class="text-2xl font-bold uppercase tracking-widest text-white mb-6">
        {{ data.portfolio ? 'Edit Portfolio' : 'Create New Portfolio' }}
      </h2>
      
      <form [formGroup]="portfolioForm" (ngSubmit)="onSubmit()" class="grid gap-4">
        <mat-form-field appearance="outline" class="premium-field">
          <mat-label>Portfolio Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Retirement Fund">
          <mat-error *ngIf="portfolioForm.get('name')?.hasError('required')">Name is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="premium-field">
          <mat-label>Initial Capital (Optional)</mat-label>
          <input matInput type="number" formControlName="availableCash" placeholder="0.00">
        </mat-form-field>

        <div class="flex justify-end gap-4 mt-8">
          <button type="button" mat-button (click)="onCancel()" class="text-gray-400 hover:text-white uppercase tracking-widest text-[10px] font-bold">Cancel</button>
          <button type="submit" mat-flat-button color="primary" [disabled]="portfolioForm.invalid" class="bg-indigo-600 uppercase tracking-widest font-black px-10 rounded-sm">
            {{ data.portfolio ? 'UPDATE PORTFOLIO' : 'CREATE PORTFOLIO' }}
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
export class PortfolioDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PortfolioDialogComponent>);
  protected data = inject<{ portfolio?: any }>(MAT_DIALOG_DATA);

  portfolioForm: FormGroup = this.fb.group({
    name: [this.data.portfolio?.name || '', [Validators.required]],
    availableCash: [this.data.portfolio?.availableCash || 0]
  });

  onSubmit() {
    if (this.portfolioForm.valid) {
      this.dialogRef.close(this.portfolioForm.value);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
