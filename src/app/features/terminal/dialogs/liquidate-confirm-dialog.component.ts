import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

type Company = {
  id: number;
  name: string;
  ticker: string;
};

@Component({
  selector: 'app-liquidate-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <div class="dialog-container bg-[#0a0a0a] text-white p-12 flex flex-col shadow-2xl">
      <div class="flex justify-between items-center mb-10">
        <h2 class="text-3xl font-bold tracking-[0.1em] uppercase text-red-600 italic">CONFIRM LIQUIDATION</h2>
        <button (click)="close()" class="text-gray-500 hover:text-white transition-colors">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p class="text-white text-sm font-medium leading-relaxed mb-12 opacity-80">
        You are about to initiate the liquidation protocol for <span class="text-white font-bold">{{ data.company.name }} ({{ data.company.ticker }})</span>. 
        This action will permanently remove the entity from the system registry and invalidate all outstanding shares.
      </p>

      <div class="bg-[#111] p-6 border-l-2 border-red-900 mb-12">
        <p class="text-[10px] font-bold text-red-900 tracking-widest uppercase mb-2">WARNING</p>
        <p class="text-xs text-white uppercase tracking-wider leading-relaxed opacity-60">
          This operation is irreversible. All market data associated with this entity will be purged.
        </p>
      </div>

      <div class="space-y-4">
        <button (click)="confirm()" 
                class="w-full bg-red-900 text-white font-bold py-4 text-xs uppercase tracking-[0.3em] hover:bg-red-600 transition-all"
                style="font-family: sans-serif-condensed, 'Roboto Condensed', 'Helvetica Neue Condensed', 'Arial Narrow', sans-serif;">
          AUTHORIZE LIQUIDATION
        </button>
        <button (click)="close()" 
                class="w-full bg-transparent border border-gray-900 text-gray-500 font-bold py-4 text-xs uppercase tracking-[0.3em] hover:text-white hover:border-gray-500 transition-all"
                style="font-family: sans-serif-condensed, 'Roboto Condensed', 'Helvetica Neue Condensed', 'Arial Narrow', sans-serif;">
          ABORT OPERATION
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class LiquidateConfirmDialogComponent {
  private dialogRef = inject(MatDialogRef<LiquidateConfirmDialogComponent>);
  protected data = inject<{ company: Company }>(MAT_DIALOG_DATA);

  confirm() {
    this.dialogRef.close(true);
  }

  close() {
    this.dialogRef.close(false);
  }
}
