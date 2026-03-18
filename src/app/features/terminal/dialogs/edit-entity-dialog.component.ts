import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

type Company = {
  id: number;
  name: string;
  ticker: string;
  sector: string;
  marketCap: string;
  price: number;
};

@Component({
  selector: 'app-edit-entity-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <div class="dialog-container bg-[#0a0a0a] text-white p-12 flex flex-col shadow-2xl">
      <div class="flex justify-between items-center mb-10">
        <h2 class="text-3xl font-bold tracking-[0.1em] uppercase italic">EDIT ENTITY</h2>
        <button (click)="close()" class="text-gray-500 hover:text-white transition-colors">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p class="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-12">Update company entity details</p>

      <form [formGroup]="editForm" (ngSubmit)="onSubmit()" class="space-y-8 flex-1">
        <div class="field-group border-b border-gray-800 pb-2">
          <label class="block text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-2">NAME</label>
          <input formControlName="name" type="text" 
                 class="w-full bg-transparent text-white text-sm outline-none placeholder-gray-600"
                 placeholder="Enter full company name">
        </div>

        <div class="field-group border-b border-gray-800 pb-2">
          <label class="block text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-2">TICKER</label>
          <input formControlName="ticker" type="text" 
                 class="w-full bg-transparent text-white text-sm outline-none placeholder-gray-600 uppercase"
                 placeholder="e.g. AAPL">
        </div>

        <div class="field-group border-b border-gray-800 pb-2">
          <label class="block text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-2">SECTOR</label>
          <input formControlName="sector" type="text" 
                 class="w-full bg-transparent text-white text-sm outline-none placeholder-gray-600"
                 placeholder="e.g. Information Technology">
        </div>

        <div class="field-group border-b border-gray-800 pb-2">
          <label class="block text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-2">MARKET CAP</label>
          <input formControlName="marketCap" type="text" 
                 class="w-full bg-transparent text-white text-sm outline-none placeholder-gray-600"
                 placeholder="e.g. 2.98T">
        </div>

        <div class="field-group border-b border-gray-800 pb-2">
          <label class="block text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-2">SHARE PRICE</label>
          <input formControlName="price" type="number" 
                 class="w-full bg-transparent text-white text-sm outline-none placeholder-gray-600"
                 placeholder="0.00">
        </div>

        <div class="pt-12">
          <button type="submit" 
                  [disabled]="editForm.invalid"
                  class="w-full bg-white text-black font-bold py-4 text-xs uppercase tracking-[0.3em] hover:bg-gray-200 transition-all disabled:opacity-20 translate-y-0 hover:-translate-y-1"
                  style="font-family: sans-serif-condensed, 'Roboto Condensed', 'Helvetica Neue Condensed', 'Arial Narrow', sans-serif;">
            UPDATE ENTITY
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
export class EditEntityDialogComponent {
  private dialogRef = inject(MatDialogRef<EditEntityDialogComponent>);
  protected data = inject<{ company: Company }>(MAT_DIALOG_DATA);

  readonly editForm = new FormGroup({
    name: new FormControl(this.data.company.name, [Validators.required]),
    ticker: new FormControl(this.data.company.ticker, [Validators.required]),
    sector: new FormControl(this.data.company.sector, [Validators.required]),
    marketCap: new FormControl(this.data.company.marketCap, [Validators.required]),
    price: new FormControl(this.data.company.price, [Validators.required]),
  });

  onSubmit() {
    if (this.editForm.valid) {
      this.dialogRef.close(this.editForm.value);
    }
  }

  close() {
    this.dialogRef.close();
  }
}
