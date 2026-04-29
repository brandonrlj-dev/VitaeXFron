import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-score-circle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="score-wrap" [style.width]="size" [style.height]="size">
      <svg [attr.width]="numSize" [attr.height]="numSize" [attr.viewBox]="'0 0 ' + numSize + ' ' + numSize">
        <circle
          class="track"
          [attr.cx]="center" [attr.cy]="center" [attr.r]="radius"
          fill="none" stroke="#e5e7eb" [attr.stroke-width]="strokeWidth"
        />
        <circle
          class="progress"
          [attr.cx]="center" [attr.cy]="center" [attr.r]="radius"
          fill="none"
          [attr.stroke]="color"
          [attr.stroke-width]="strokeWidth"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset"
          stroke-linecap="round"
          [attr.transform]="'rotate(-90 ' + center + ' ' + center + ')'"
        />
      </svg>
      <div class="score-label">
        <span class="value" [style.color]="color">{{ score }}</span>
        <span class="pct">%</span>
      </div>
    </div>
  `,
  styles: [`
    .score-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    svg {
      position: absolute;
      top: 0; left: 0;
    }

    .progress {
      transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .score-label {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: baseline;
      gap: 1px;
      line-height: 1;
    }

    .value {
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
    }

    .pct {
      color: #9ca3af;
      font-weight: 400;
    }
  `]
})
export class ScoreCircleComponent implements OnChanges {
  @Input() score = 0;
  @Input() color = '#03837b';
  @Input() size  = '72px';
  @Input() strokeWidth = 7;

  numSize     = 72;
  center      = 36;
  radius      = 29;
  circumference = 0;
  dashOffset    = 0;

  ngOnChanges() {
    this.numSize      = parseInt(this.size, 10);
    this.center       = this.numSize / 2;
    this.radius       = this.center - this.strokeWidth - 1;
    this.circumference = 2 * Math.PI * this.radius;
    this.dashOffset    = this.circumference * (1 - this.score / 100);
  }
}
