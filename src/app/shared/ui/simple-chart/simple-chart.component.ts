import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
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
}

@Component({
  selector: 'app-simple-chart',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective
  ],
  template: `
    <div class="simple-chart-container">
      <canvas baseChart [data]="chartData" [options]="chartOptions"></canvas>
      @if (!priceData || priceData.length === 0) {
        <div class="no-data">
          <p>No historical data available</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .simple-chart-container {
      position: relative;
      height: 400px;
      width: 100%;
    }
    
    .no-data {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    
    canvas {
      max-height: 400px;
    }
  `]
})
export class SimpleChartComponent implements OnChanges {
  @Input() priceData: PriceData[] = [];
  @Input() stockSymbol: string = '';

  chartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Price',
        data: [],
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#4caf50',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.1)',
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
      },
      y: {
        display: true,
        position: 'right',
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.1)',
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
    elements: {
      point: {
        radius: 0,
        hoverRadius: 6,
      },
      line: {
        borderWidth: 2,
        tension: 0.4,
      },
    },
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['priceData'] || changes['stockSymbol']) {
      this.updateChartData();
    }
  }

  private updateChartData() {
    if (!this.priceData || this.priceData.length === 0) {
      return;
    }

    // Sort by date
    const sortedData = [...this.priceData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Take last 50 data points for better performance
    const recentData = sortedData.slice(-50);

    this.chartData.labels = recentData.map((d) => {
      const date = new Date(d.date);
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    });

    this.chartData.datasets[0].data = recentData.map((d) => d.price);

    // Update title with stock symbol
    if (this.chartOptions?.plugins?.title) {
      this.chartOptions.plugins.title.text = `${this.stockSymbol} - Price Chart`;
    }
  }
}
