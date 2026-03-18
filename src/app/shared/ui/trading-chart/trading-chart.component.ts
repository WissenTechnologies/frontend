import { Component, Input, OnChanges, SimpleChanges, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartData,
  ChartOptions,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, Subscription, interval } from 'rxjs';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface PriceData {
  date: string;
  price: number;
  volume?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

export type ChartType = 'line' | 'bar' | 'area' | 'candle';

export type TimeRange = '1M' | '5M' | '15M' | '30M' | '1H' | '1D' | '1W' | '1MO' | '3M' | '6M' | '1Y';

@Component({
  selector: 'app-trading-chart',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="trading-chart-container">
      <div class="chart-header">
        <div class="chart-title">
          <h3>{{ stockSymbol }} - Real Time Chart</h3>
          <span class="current-price" [class.positive]="priceChange > 0" [class.negative]="priceChange < 0">
            ₹{{ currentPrice.toFixed(2) }}
            <span class="change">
              {{ priceChange > 0 ? '+' : '' }}{{ priceChange.toFixed(2) }} 
              ({{ priceChangePercent > 0 ? '+' : '' }}{{ priceChangePercent.toFixed(2) }}%)
            </span>
          </span>
        </div>
        
        <div class="chart-controls">
          <mat-form-field appearance="outline" class="time-range-select">
            <mat-label>Time Range</mat-label>
            <mat-select [(value)]="selectedTimeRange" (selectionChange)="onTimeRangeChange()">
              <mat-option value="1M">1 Minute</mat-option>
              <mat-option value="5M">5 Minutes</mat-option>
              <mat-option value="15M">15 Minutes</mat-option>
              <mat-option value="30M">30 Minutes</mat-option>
              <mat-option value="1H">1 Hour</mat-option>
              <mat-option value="1D">1 Day</mat-option>
              <mat-option value="1W">1 Week</mat-option>
              <mat-option value="1MO">1 Month</mat-option>
              <mat-option value="3M">3 Months</mat-option>
              <mat-option value="6M">6 Months</mat-option>
              <mat-option value="1Y">1 Year</mat-option>
            </mat-select>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="chart-type-select">
            <mat-label>Chart Type</mat-label>
            <mat-select [(value)]="chartType" (selectionChange)="onChartTypeChange()">
              <mat-option value="line">Line</mat-option>
              <mat-option value="bar">Bar</mat-option>
              <mat-option value="area">Area</mat-option>
              <mat-option value="candle">Candlestick</mat-option>
            </mat-select>
          </mat-form-field>
          
          <button mat-icon-button (click)="toggleRealTime()" [class.active]="isRealTime">
            <mat-icon>{{ isRealTime ? 'pause' : 'play_arrow' }}</mat-icon>
          </button>
          
          <button mat-icon-button (click)="refreshChart()">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </div>
      
      <div class="chart-wrapper">
        <canvas baseChart [data]="chartData" [options]="chartOptions"></canvas>
        @if (!priceData || priceData.length === 0) {
          <div class="no-data">
            <mat-icon>bar_chart</mat-icon>
            <p>No data available</p>
          </div>
        }
      </div>
      
      <div class="chart-stats">
        <div class="stat">
          <span class="label">Open:</span>
          <span class="value">₹{{ dayOpen.toFixed(2) }}</span>
        </div>
        <div class="stat">
          <span class="label">High:</span>
          <span class="value">₹{{ dayHigh.toFixed(2) }}</span>
        </div>
        <div class="stat">
          <span class="label">Low:</span>
          <span class="value">₹{{ dayLow.toFixed(2) }}</span>
        </div>
        <div class="stat">
          <span class="label">Volume:</span>
          <span class="value">{{ formattedVolume }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .trading-chart-container {
      background: #1a1a1a;
      border-radius: 8px;
      padding: 16px;
      height: 500px;
      display: flex;
      flex-direction: column;
    }
    
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }
    
    .chart-title h3 {
      margin: 0;
      color: #fff;
      font-size: 18px;
      font-weight: 600;
    }
    
    .current-price {
      display: block;
      font-size: 24px;
      font-weight: 700;
      margin-top: 4px;
    }
    
    .current-price.positive {
      color: #4caf50;
    }
    
    .current-price.negative {
      color: #f44336;
    }
    
    .change {
      font-size: 14px;
      font-weight: 400;
      margin-left: 8px;
    }
    
    .chart-controls {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .time-range-select {
      min-width: 120px;
    }
    
    .chart-type-select {
      min-width: 100px;
    }
    
    button.active {
      background-color: #4caf50;
      color: white;
    }
    
    .chart-wrapper {
      flex: 1;
      position: relative;
      min-height: 300px;
    }
    
    .no-data {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #666;
    }
    
    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 8px;
    }
    
    .chart-stats {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #333;
    }
    
    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .stat .label {
      font-size: 12px;
      color: #999;
      margin-bottom: 4px;
    }
    
    .stat .value {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }
    
    @media (max-width: 768px) {
      .chart-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .chart-controls {
        width: 100%;
        justify-content: space-between;
      }
      
      .chart-stats {
        flex-wrap: wrap;
        gap: 12px;
      }
    }
  `]
})
export class TradingChartComponent implements OnChanges, OnInit, OnDestroy, AfterViewInit {
  @Input() priceData: PriceData[] = [];
  @Input() stockSymbol: string = '';

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  chartType: ChartType = 'area';
  selectedTimeRange: TimeRange = '1D';
  isRealTime: boolean = true;
  
  private realTimeSubscription?: Subscription;
  private destroy$ = new Subject<void>();
  private isInitialized = false;

  chartData: ChartData = {
    labels: [],
    datasets: []
  };

  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animation: {
      duration: this.isRealTime ? 300 : 750,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#4caf50',
        borderWidth: 1,
        cornerRadius: 4,
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed?.y;
            return value !== null && value !== undefined
              ? `Price: ₹${Number(value).toFixed(2)}`
              : 'N/A';
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        offset: false,
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 11,
          },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
        bounds: 'ticks'
      },
      y: {
        display: true,
        position: 'right',
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12,
          },
          callback: (value: any) => `₹${Number(value).toLocaleString()}`,
        },
      },
    },
  };

  // Computed properties
  get currentPrice(): number {
    return this.priceData.length > 0 ? this.priceData[this.priceData.length - 1].price : 0;
  }

  get previousPrice(): number {
    return this.priceData.length > 1 ? this.priceData[this.priceData.length - 2].price : this.currentPrice;
  }

  get priceChange(): number {
    return this.currentPrice - this.previousPrice;
  }

  get priceChangePercent(): number {
    return this.previousPrice !== 0 ? (this.priceChange / this.previousPrice) * 100 : 0;
  }

  get dayOpen(): number {
    return this.priceData.length > 0 ? this.priceData[0].price : 0;
  }

  get dayHigh(): number {
    return Math.max(...this.priceData.map(d => d.price), 0);
  }

  get dayLow(): number {
    return Math.min(...this.priceData.map(d => d.price), 0);
  }

  get totalVolume(): number {
    return this.priceData.reduce((sum, d) => sum + (d.volume || 0), 0);
  }

  get formattedVolume(): string {
    const volume = this.totalVolume;
    if (volume >= 1000000) {
      return (volume / 1000000).toFixed(1) + 'M';
    } else if (volume >= 1000) {
      return (volume / 1000).toFixed(1) + 'K';
    }
    return volume.toString();
  }

  ngOnInit() {
    this.startRealTimeUpdates();
  }

  ngAfterViewInit() {
    this.isInitialized = true;
    this.updateChartData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['priceData'] || changes['stockSymbol']) {
      this.updateChartData();
    }
  }

  ngOnDestroy() {
    this.stopRealTimeUpdates();
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTimeRangeChange() {
    this.updateChartData(false);
  }

  onChartTypeChange() {
    this.updateChartData(false);
  }

  toggleRealTime() {
    this.isRealTime = !this.isRealTime;
    if (this.isRealTime) {
      this.startRealTimeUpdates();
    } else {
      this.stopRealTimeUpdates();
    }
  }

  refreshChart() {
    this.updateChartData(false);
  }

  private startRealTimeUpdates() {
    this.stopRealTimeUpdates();
    
    if (this.isRealTime) {
      this.realTimeSubscription = interval(1000).subscribe(() => {
        this.simulateRealTimeUpdate();
      });
    }
  }

  private stopRealTimeUpdates() {
    if (this.realTimeSubscription) {
      this.realTimeSubscription.unsubscribe();
      this.realTimeSubscription = undefined;
    }
  }

  private simulateRealTimeUpdate() {
    if (this.priceData.length === 0) return;

    const lastDataPoint = this.priceData[this.priceData.length - 1];
    const lastPrice = lastDataPoint.price;
    const lastOpen = lastDataPoint.open || lastPrice;
    
    // Adjust volatility based on time range - smaller time ranges have more relative movement
    let volatility = 0.02; // Default ±2% (match backend)
    if (['1M', '5M'].includes(this.selectedTimeRange)) {
      volatility = 0.015; // ±1.5% for very short ranges
    } else if (['15M', '30M'].includes(this.selectedTimeRange)) {
      volatility = 0.018; // ±1.8% for short ranges
    }
    
    const changePercent = (Math.random() - 0.5) * volatility;
    const newPrice = Math.max(0.01, lastPrice * (1 + changePercent));

    // Generate OHLC data for more realistic candlestick charts
    const priceMovement = newPrice - lastOpen;
    const high = Math.max(newPrice, lastPrice) * (1 + Math.random() * volatility / 4);
    const low = Math.min(newPrice, lastPrice) * (1 - Math.random() * volatility / 4);

    const newDataPoint: PriceData = {
      date: new Date().toISOString(),
      price: newPrice,
      open: lastDataPoint.close || lastOpen, // Use previous close as new open
      high: high,
      low: low,
      close: newPrice,
      volume: Math.floor(Math.random() * 1000000) + 500000
    };

    // Keep more data points for intraday ranges, fewer for longer ranges
    let maxDataPoints = 100;
    if (['1M', '5M'].includes(this.selectedTimeRange)) {
      maxDataPoints = 60; // Keep last 60 points for 1-5 minute ranges
    } else if (['15M', '30M', '1H'].includes(this.selectedTimeRange)) {
      maxDataPoints = 80; // Keep last 80 points for 15-60 minute ranges
    }

    // Add new data point and keep only recent points for performance
    this.priceData = [...this.priceData.slice(-maxDataPoints + 1), newDataPoint];
    
    // Update chart with smooth animation
    this.updateChartData(true);
  }

  private updateChartData(isRealTimeUpdate: boolean = false) {
    if (!this.priceData || this.priceData.length === 0) {
      this.chartData = { labels: [], datasets: [] };
      return;
    }

    const filteredData = this.filterDataByTimeRange(this.priceData, this.selectedTimeRange);
    const labels = filteredData.map(d => this.formatLabel(d.date));
    const prices = filteredData.map(d => d.price);

    const datasetConfig = this.getDatasetConfig();

    if (this.isInitialized && this.chart && isRealTimeUpdate) {
      // For real-time updates, update existing chart data smoothly
      if (this.chart.chart) {
        this.chart.chart.data.labels = labels;
        const currentDataset = this.chart.chart.data.datasets[0] as any;
        this.chart.chart.data.datasets[0] = {
          ...currentDataset,
          data: prices,
          ...datasetConfig
        };
        
        // Use 'none' mode for real-time updates to prevent animation from zero
        this.chart.chart.update('none');
      }
    } else {
      // For initial load or user interactions, recreate chart data
      this.chartData = {
        labels,
        datasets: [
          {
            label: `${this.stockSymbol} Price`,
            data: prices,
            ...datasetConfig
          }
        ]
      };
    }
  }

  private filterDataByTimeRange(data: PriceData[], range: TimeRange): PriceData[] {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (range) {
      case '1M':
        startDate.setMinutes(now.getMinutes() - 1);
        break;
      case '5M':
        startDate.setMinutes(now.getMinutes() - 5);
        break;
      case '15M':
        startDate.setMinutes(now.getMinutes() - 15);
        break;
      case '30M':
        startDate.setMinutes(now.getMinutes() - 30);
        break;
      case '1H':
        startDate.setHours(now.getHours() - 1);
        break;
      case '1D':
        startDate.setHours(now.getHours() - 24);
        break;
      case '1W':
        startDate.setDate(now.getDate() - 7);
        break;
      case '1MO':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Filter data strictly within the time range
    const filteredData = data.filter(d => {
      const dataDate = new Date(d.date);
      return dataDate >= startDate && dataDate <= endDate;
    });

    // If no data found in range, return empty array to show "no data"
    if (filteredData.length === 0) {
      return [];
    }

    // Sort by date to ensure proper order
    return filteredData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private formatLabel(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    
    // For intraday ranges (1H or less), show time with seconds
    if (['1M', '5M', '15M', '30M', '1H'].includes(this.selectedTimeRange)) {
      return date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    }
    
    // Check if it's today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Check if it's this year
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric',
      year: '2-digit'
    });
  }

  private getDatasetConfig() {
    const isBullish = this.priceChange >= 0;
    const bullishColor = '#22c55e';
    const bearishColor = '#dc2626';
    const baseColor = isBullish ? bullishColor : bearishColor;
    
    switch (this.chartType) {
      case 'candle':
        return this.getCandlestickConfig(bullishColor, bearishColor);
        
      case 'bar':
        return {
          type: 'bar' as const,
          backgroundColor: this.getBarColors(bullishColor, bearishColor),
          borderColor: this.getBarBorderColors(bullishColor, bearishColor),
          borderWidth: 1
        };
        
      case 'area':
        return {
          type: 'line' as const,
          borderColor: baseColor,
          backgroundColor: this.createGradient(baseColor),
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: baseColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        } as any;
        
      case 'line':
      default:
        return {
          type: 'line' as const,
          borderColor: baseColor,
          backgroundColor: 'transparent',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: baseColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        } as any;
    }
  }

  private createGradient(baseColor?: string): string {
    // Create a gradient for area charts
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    const color = baseColor || '#4caf50';
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, 'transparent');
    return gradient as any;
  }

  private getCandlestickConfig(bullishColor: string, bearishColor: string) {
    const candleData = this.prepareCandlestickData();
    
    return {
      type: 'bar' as const,
      backgroundColor: candleData.map(d => d.isBullish ? bullishColor + '80' : bearishColor + '80'),
      borderColor: candleData.map(d => d.isBullish ? bullishColor : bearishColor),
      borderWidth: 1,
      data: candleData.map(d => [
        d.low,
        d.open,
        d.close,
        d.high
      ])
    } as any;
  }

  private getBarColors(bullishColor: string, bearishColor: string): string[] {
    const filteredData = this.filterDataByTimeRange(this.priceData, this.selectedTimeRange);
    return filteredData.map((_, index) => {
      if (index === 0) return bullishColor + '80';
      const currentPrice = filteredData[index].price;
      const previousPrice = filteredData[index - 1].price;
      return currentPrice >= previousPrice ? bullishColor + '80' : bearishColor + '80';
    });
  }

  private getBarBorderColors(bullishColor: string, bearishColor: string): string[] {
    const filteredData = this.filterDataByTimeRange(this.priceData, this.selectedTimeRange);
    return filteredData.map((_, index) => {
      if (index === 0) return bullishColor;
      const currentPrice = filteredData[index].price;
      const previousPrice = filteredData[index - 1].price;
      return currentPrice >= previousPrice ? bullishColor : bearishColor;
    });
  }

  private prepareCandlestickData() {
    const filteredData = this.filterDataByTimeRange(this.priceData, this.selectedTimeRange);
    
    return filteredData.map((data, index) => {
      // For demo purposes, simulate OHLC data if not available
      const price = data.price;
      const volatility = 0.02; // 2% volatility
      const open = data.open || (price * (1 - volatility / 2));
      const close = data.close || price;
      const high = data.high || Math.max(open, close) * (1 + volatility / 4);
      const low = data.low || Math.min(open, close) * (1 - volatility / 4);
      
      const isBullish = close >= open;
      
      return {
        open,
        high,
        low,
        close,
        isBullish,
        date: data.date
      };
    });
  }

  private formatVolume(volume: number): string {
    if (volume >= 1000000) {
      return (volume / 1000000).toFixed(1) + 'M';
    } else if (volume >= 1000) {
      return (volume / 1000).toFixed(1) + 'K';
    }
    return volume.toString();
  }
}
