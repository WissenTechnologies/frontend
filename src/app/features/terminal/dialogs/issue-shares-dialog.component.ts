import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-issue-shares-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  template: `
    <div class="dialog-container p-12 flex flex-col shadow-2xl" style="background: var(--surface); color: var(--text);">
      <div class="flex justify-between items-center mb-10">
        <h2 class="text-3xl font-bold tracking-[0.1em] uppercase italic" style="font-family: sans-serif-condensed, 'Roboto Condensed', 'Helvetica Neue Condensed', 'Arial Narrow', sans-serif;">ISSUE SHARES</h2>
        <button (click)="close()" class="transition-colors" style="background:none;border:none;color:var(--text-muted);cursor:pointer;">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p class="text-[10px] font-bold tracking-widest uppercase mb-12" style="color: var(--text-muted); font-family: sans-serif-condensed, 'Roboto Condensed', 'Helvetica Neue Condensed', 'Arial Narrow', sans-serif;">Add new shares to an existing company.</p>

      <form [formGroup]="issueForm" (ngSubmit)="onSubmit()" class="space-y-8 flex-1">
        <div class="field-group border-b pb-2" style="border-color: var(--border);">
          <label class="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style="color: var(--text); font-family: sans-serif-condensed, 'Roboto Condensed', 'Helvetica Neue Condensed', 'Arial Narrow', sans-serif;">COMPANY</label>
          <select formControlName="companyId" 
                  class="w-full bg-transparent text-sm outline-none cursor-pointer appearance-none" style="color: var(--text); font-family: sans-serif-condensed, 'Roboto Condensed', 'Helvetica Neue Condensed', 'Arial Narrow', sans-serif;">
            <option value="" disabled style="background: var(--surface);">SELECT ENTITY</option>
            @for (company of data.companies; track company.id) {
              <option [value]="company.id" style="background: var(--surface);">{{ company.ticker }} - {{ company.name }}</option>
            }
          </select>
        </div>

        <div class="field-group border-b pb-2" style="border-color: var(--border);">
          <label class="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style="color: var(--text); font-family: sans-serif-condensed, 'Roboto Condensed', 'Helvetica Neue Condensed', 'Arial Narrow', sans-serif;">QUANTITY</label>
          <input formControlName="quantity" type="number" 
                 class="w-full bg-transparent text-sm outline-none" style="color: var(--text); font-family: sans-serif-condensed, 'Roboto Condensed', 'Helvetica Neue Condensed', 'Arial Narrow', sans-serif;"
                 placeholder="0">
        </div>

        <div class="pt-12">
          <button type="submit" 
                  [disabled]="issueForm.invalid"
                  class="w-full font-bold py-4 text-xs uppercase tracking-[0.3em] transition-all disabled:opacity-20 translate-y-0 hover:-translate-y-1"
                  style="background: var(--text); color: var(--surface); font-family: sans-serif-condensed, 'Roboto Condensed', 'Helvetica Neue Condensed', 'Arial Narrow', sans-serif;">
            CONFIRM ISSUANCE
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class IssueSharesDialogComponent {
  private dialogRef = inject(MatDialogRef<IssueSharesDialogComponent>);
  protected data = inject(MAT_DIALOG_DATA);

  readonly issueForm = new FormGroup({
    companyId: new FormControl('', [Validators.required]),
    quantity: new FormControl('', [Validators.required, Validators.min(1)]),
  });

  onSubmit() {
    if (this.issueForm.valid) {
      this.dialogRef.close(this.issueForm.value);
    }
  }

  close() {
    this.dialogRef.close();
  }
}
