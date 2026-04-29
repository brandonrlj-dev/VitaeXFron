import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { DimensionScores } from '../../../core/models';

@Component({
  selector: 'app-spider-chart',
  standalone: true,
  imports: [ChartModule],
  template: `
    <p-chart
      type="radar"
      [data]="chartData"
      [options]="chartOptions"
      [style]="{ width: '100%', maxWidth: maxWidth }"
    ></p-chart>
  `,
  styles: [`:host { display: block; }`]
})
export class SpiderChartComponent implements OnChanges {
  @Input() egresadoScores!: DimensionScores;
  @Input() idealScores?: DimensionScores;
  @Input() maxWidth = '360px';
  @Input() showLegend = true;

  chartData: any = {};
  chartOptions: any = {};

  ngOnChanges() {
    if (!this.egresadoScores) return;
    this.buildChart();
  }

  private buildChart() {
    const labels = ['Psicométrica', 'Cognitiva', 'Técnica', 'Proyectiva'];
    const s = this.egresadoScores;

    this.chartData = {
      labels,
      datasets: [
        {
          label: 'Mi Perfil',
          data: [s.psicometrica, s.cognitiva, s.tecnica, s.proyectiva],
          fill: true,
          backgroundColor: 'rgba(3,131,123,0.18)',
          borderColor: '#03837b',
          borderWidth: 2.5,
          pointBackgroundColor: '#03837b',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        ...(this.idealScores ? [{
          label: 'Perfil Ideal',
          data: [
            this.idealScores.psicometrica,
            this.idealScores.cognitiva,
            this.idealScores.tecnica,
            this.idealScores.proyectiva,
          ],
          fill: false,
          backgroundColor: 'transparent',
          borderColor: '#033d3c',
          borderWidth: 2,
          borderDash: [6, 4],
          pointBackgroundColor: '#033d3c',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
        }] : [])
      ]
    };

    this.chartOptions = {
      responsive: true,
      animation: { duration: 700, easing: 'easeInOutQuart' },
      plugins: {
        legend: {
          display: this.showLegend && !!this.idealScores,
          position: 'bottom',
          labels: {
            font: { family: 'Inter', size: 12 },
            color: '#6b7280',
            boxWidth: 12,
            padding: 16,
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.raw}%`
          }
        }
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 25,
            font: { family: 'Inter', size: 9 },
            color: '#9ca3af',
            backdropColor: 'transparent',
          },
          pointLabels: {
            font: { family: 'Inter', size: 12, weight: '600' },
            color: '#374151',
          },
          grid: { color: '#e5e7eb' },
          angleLines: { color: '#e5e7eb' },
        }
      }
    };
  }
}
