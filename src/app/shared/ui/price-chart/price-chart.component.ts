import { Component, Input, OnChanges, SimpleChanges, AfterViewInit, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartEvent } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import {
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement,
} from 'chartjs-chart-financial';

Chart.register(
  ...registerables,
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement
);

export interface PriceData {
  date: string;
  price: number;
}

export interface TimeRangeOption {
  value: number;
  label: string;
  days: number;
}

export type ChartTypeOption = 'line' | 'bar' | 'candlestick';

type CandlePoint = { x: string | number | Date; o: number; h: number; l: number; c: number };

@Component({
  selector: 'app-price-chart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    FormsModule,
    BaseChartDirective
  ],
  templateUrl: './price-chart.component.html',
  styleUrls: ['./price-chart.component.scss']
})
export class PriceChartComponent implements OnChanges, AfterViewInit, OnInit {
  @Input() priceData: PriceData[] = [];
  @Input() stockSymbol: string = '';

  @ViewChild(BaseChartDirective)
  private baseChart?: BaseChartDirective;

  chartType: any = 'candlestick';
  showGrid = true;
  showLegend = true;
  animationDuration = 1000;
  chartColor = '#4caf50';
  selectedTimeRange: number = 30; // Default to 30 days

  chartTypes: { value: ChartTypeOption; label: string }[] = [
    { value: 'candlestick', label: 'Candlestick' },
    { value: 'line', label: 'Line Chart' },
    { value: 'bar', label: 'Bar Chart' },
  ];

  timeRangeOptions: TimeRangeOption[] = [
    { value: 5, label: '5 Minutes', days: 5 },
    { value: 15, label: '15 Minutes', days: 15 },
    { value: 30, label: '30 Minutes', days: 30 },
    { value: 60, label: '1 Hour', days: 60 },
    { value: 1440, label: '1 Day', days: 1440 },
    { value: 10080, label: '1 Week', days: 10080 },
  ];

  // Generate test data if no input provided
  ngOnInit() {
    if (!this.priceData || this.priceData.length === 0) {
      this.generateTestData();
    }
  }

  generateTestData() {
    const companies = [
      { symbol: 'AAPL', name: 'Apple Inc.', color: '#000000' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', color: '#4285F4' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', color: '#00A4EF' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', color: '#FF9900' },
      { symbol: 'TSLA', name: 'Tesla Inc.', color: '#CC0000' },
      { symbol: 'META', name: 'Meta Platforms', color: '#1877F2' },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', color: '#76B900' },
      { symbol: 'NFLX', name: 'Netflix Inc.', color: '#E50914' }
    ];
    
    const selectedCompany = companies[Math.floor(Math.random() * companies.length)];
    const basePrice = 150 + Math.random() * 100;
    const volatility = 0.02 + Math.random() * 0.03;
    
    this.priceData = [];
    const today = new Date();
    
    // Generate 2 years of daily data (730 data points)
    for (let i = 730; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic price movement
      const randomWalk = (Math.random() - 0.5) * volatility;
      const trendFactor = 1 + (730 - i) * 0.0001; // Slight upward trend
      const price = Math.max(50, basePrice * trendFactor + randomWalk * basePrice);
      
      this.priceData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: Math.round(price * 100) / 100
      });
    }
    
    // Update stock symbol and color if empty
    if (!this.stockSymbol) {
      this.stockSymbol = selectedCompany.symbol;
      this.chartColor = selectedCompany.color;
    }
  }

  private lastRenderedSymbol = '';
  private lastRenderedLength = 0;

  private syncAxisForChartType() {
    const xScale = this.chartOptions?.scales?.x;
    if (!xScale) return;

    // Candlestick uses numeric index on x (see toCandles()).
    xScale.type = this.chartType === 'candlestick' ? 'linear' : 'category';
  }

  public chartData: any = {
    labels: [],
    datasets: [],
  };

  public chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    layout: {
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: '#0a0a0a',
        titleColor: '#666',
        titleFont: { size: 10, weight: 'bold' },
        bodyColor: '#ffffff',
        bodyFont: { size: 14, weight: 800 },
        borderColor: '#333',
        borderWidth: 1,
        cornerRadius: 2,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context: any): string => {
            const parsed = context.parsed;
            const value = typeof parsed === 'number' ? parsed : parsed?.y;
            return value !== null && value !== undefined
              ? `₹ ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
              : 'N/A';
          }
        }
      }
    },
    hover: {
      mode: 'index',
      intersect: false
    },
    scales: {
      x: {
        type: 'category',
        display: true,
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.05)',
          drawOnChartArea: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 11,
            weight: 500
          },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7,
          padding: 10,
          callback: (val: any): string => {
            const labels = (this.chartData?.labels ?? []) as any[];
            const label = labels[Number(val)] ?? labels.find((_: any, i: number) => i === Number(val));
            if (!label) return '';

            const date = new Date(label);
            if (isNaN(date.getTime())) return String(label);

            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();

            return isToday
              ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              : date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
          },
        },
        border: {
          display: true,
          color: 'rgba(255, 255, 255, 0.2)',
          width: 1
        }
      },
      y: {
        display: true,
        position: 'right',
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: { size: 10, weight: 500 },
          callback: (value: any): string => `₹${Number(value).toLocaleString()}`,
          padding: 10
        },
        border: {
          display: true,
          color: 'rgba(255, 255, 255, 0.2)',
          width: 1
        }
      }
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 6,
        backgroundColor: '#fff',
        borderColor: '#000',
        borderWidth: 2,
        hitRadius: 20
      },
      line: {
        tension: 0.5,
        cubicInterpolationMode: 'monotone',
        borderWidth: 2,
        fill: true
      }
    },
    animation: {
      duration: 300,
      easing: 'easeOutQuart'
    },
    parsing: false
  };

  ngAfterViewInit() {
    this.ngOnInit(); // Generate test data if needed
    this.syncAxisForChartType();
    this.updateChartData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['priceData'] && this.priceData.length > 0) {
      this.syncAxisForChartType();
      this.updateChartData();
    }
  }

  updateChartData() {
    if (!this.priceData.length) return;

    const filteredData = this.filterDataByTimeRange(this.priceData, this.selectedTimeRange);

    // Labels are used by tick formatting even for candlestick (x is numeric index).
    const labels = filteredData.map(d => d.date);

    const shouldAppend =
      this.lastRenderedSymbol === this.stockSymbol &&
      filteredData.length >= this.lastRenderedLength &&
      this.lastRenderedLength > 0;

    if (this.chartType === 'candlestick') {
      const candles = this.toCandles(filteredData);

      if (shouldAppend && this.chartData?.datasets?.[0]?.data?.length) {
        const prevLen = this.chartData.datasets[0].data.length;
        const next = candles.slice(prevLen);
        if (next.length) {
          this.chartData.datasets[0].data.push(...next);
          this.baseChart?.chart?.update('none');
        }
      } else {
        this.chartData = {
          labels,
          datasets: [
            {
              label: `${this.stockSymbol} (${this.getTimeRangeLabel()})`,
              data: candles,
              borderColor: 'rgba(255,255,255,0.15)',
              color: {
                up: '#22c55e',
                down: '#ef4444',
                unchanged: 'rgba(255,255,255,0.4)'
              }
            }
          ]
        };
        this.baseChart?.chart?.update();
      }

      this.lastRenderedSymbol = this.stockSymbol;
      this.lastRenderedLength = candles.length;
      return;
    }

    const prices = filteredData.map(d => d.price);
    
    const gradient = this.createGradient();

    this.chartData = {
      labels: labels,
      datasets: [
        {
          label: `${this.stockSymbol} Price (${this.getTimeRangeLabel()})`,
          data: prices,
          borderColor: this.chartColor,
          backgroundColor: this.chartType === 'line' ? gradient : this.chartColor + '80',
          fill: this.chartType === 'line',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: this.chartColor,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          borderWidth: 3
        }
      ]
    };

    this.lastRenderedSymbol = this.stockSymbol;
    this.lastRenderedLength = prices.length;
  }

  private toCandles(data: PriceData[]): CandlePoint[] {
    if (!data.length) return [];

    const points: CandlePoint[] = [];
    let prevClose = data[0].price;

    for (let i = 0; i < data.length; i++) {
      const p = data[i];
      const open = prevClose;
      const close = p.price;
      const high = Math.max(open, close);
      const low = Math.min(open, close);

      points.push({
        x: i,
        o: open,
        h: high,
        l: low,
        c: close,
      });

      prevClose = close;
    }

    return points;
  }

  filterDataByTimeRange(data: PriceData[], days: number): PriceData[] {
    if (days >= data.length) {
      return data;
    }
    
    // Return last 'days' number of data points
    return data.slice(-days);
  }

  getTimeRangeLabel(): string {
    const option = this.timeRangeOptions.find(opt => opt.days === this.selectedTimeRange);
    return option ? option.label.replace('Last ', '') : 'Custom';
  }

  onTimeRangeChange() {
    this.updateChartData();
  }

  createGradient() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, this.chartColor + '20');
    gradient.addColorStop(1, 'transparent');
    return gradient;
  }

  onChartTypeChange() {
    this.syncAxisForChartType();
    this.updateChartData();
  }

  toggleGrid() {
    this.showGrid = !this.showGrid;
    this.chartOptions.scales!['x']!.grid!.display = this.showGrid;
    this.chartOptions.scales!['y']!.grid!.display = this.showGrid;
  }

  changeChartColor(color: string) {
    this.chartColor = color;
    this.updateChartData();
  }

  onChartHover(event: ChartEvent) {
    // Handle hover events for additional interactivity
    console.log('Chart hover:', event);
  }

  onChartClick(event: ChartEvent) {
    // Handle click events for additional interactivity
    console.log('Chart click:', event);
  }
}
