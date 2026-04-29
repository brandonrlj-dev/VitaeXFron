import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DimensionType, DIMENSION_CONFIG } from '../../../core/models';

@Component({
  selector: 'app-dimension-pill',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pill" [style.--dim-color]="config.color" [style.--dim-bg]="config.color + '15'">
      <i [class]="config.icon" class="dim-icon"></i>
      <span class="dim-label">{{ config.label }}</span>
      @if (score !== undefined) {
        <span class="dim-score">{{ score }}%</span>
      }
    </div>
  `,
  styles: [`
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      background: var(--dim-bg);
      border: 1px solid color-mix(in srgb, var(--dim-color) 20%, transparent);
      border-radius: 20px;
      font-size: 12px;
      white-space: nowrap;
      transition: transform 0.15s, box-shadow 0.15s;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 3px 8px color-mix(in srgb, var(--dim-color) 25%, transparent);
      }
    }

    .dim-icon {
      font-size: 11px;
      color: var(--dim-color);
    }

    .dim-label {
      font-weight: 500;
      color: var(--dim-color);
    }

    .dim-score {
      font-weight: 700;
      color: var(--dim-color);
      font-variant-numeric: tabular-nums;
      background: color-mix(in srgb, var(--dim-color) 12%, white);
      border-radius: 10px;
      padding: 1px 6px;
      font-size: 11px;
    }
  `]
})
export class DimensionPillComponent {
  @Input({ required: true }) dimension!: DimensionType;
  @Input() score?: number;

  get config() { return DIMENSION_CONFIG[this.dimension]; }
}
