import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ZoneData {
  zona: 'norte' | 'centro' | 'sur';
  label: string;
  municipios: string;
  empresas: number;
  porcentaje: number;
}

@Component({
  selector: 'app-zone-heatmap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="heatmap-wrap">
      <!-- Mapa SVG simplificado de Nayarit dividido en 3 zonas -->
      <div class="map-container">
        <svg viewBox="0 0 180 340" xmlns="http://www.w3.org/2000/svg" class="nayarit-map">
          <!-- Zona Norte -->
          <path
            class="zone-path"
            [attr.fill]="getColor('norte')"
            [attr.opacity]="getOpacity('norte')"
            d="M 30 10 L 150 10 L 160 20 L 165 40 L 155 70 L 145 90 L 130 100 L 110 105 L 90 108 L 70 105 L 55 95 L 40 80 L 25 55 L 20 35 Z"
            (mouseenter)="hovered = 'norte'"
            (mouseleave)="hovered = null"
          />
          <!-- Zona Centro -->
          <path
            class="zone-path"
            [attr.fill]="getColor('centro')"
            [attr.opacity]="getOpacity('centro')"
            d="M 25 55 L 40 80 L 55 95 L 70 105 L 90 108 L 110 105 L 130 100 L 145 90 L 155 115 L 150 140 L 140 160 L 120 168 L 100 170 L 80 168 L 60 158 L 45 140 L 30 120 L 20 95 Z"
            (mouseenter)="hovered = 'centro'"
            (mouseleave)="hovered = null"
          />
          <!-- Zona Sur -->
          <path
            class="zone-path"
            [attr.fill]="getColor('sur')"
            [attr.opacity]="getOpacity('sur')"
            d="M 30 120 L 45 140 L 60 158 L 80 168 L 100 170 L 120 168 L 140 160 L 150 140 L 160 180 L 158 210 L 150 230 L 135 248 L 115 260 L 95 265 L 75 260 L 58 248 L 45 228 L 35 205 L 28 180 Z"
            (mouseenter)="hovered = 'sur'"
            (mouseleave)="hovered = null"
          />

          <!-- Etiquetas de zona -->
          <text x="90" y="58" text-anchor="middle" class="zone-label">Norte</text>
          <text x="90" y="138" text-anchor="middle" class="zone-label">Centro</text>
          <text x="90" y="210" text-anchor="middle" class="zone-label">Sur</text>

          <!-- Puntos de empresa (Norte) -->
          @for (p of getPoints('norte'); track $index) {
            <circle
              [attr.cx]="p.x" [attr.cy]="p.y" r="4"
              fill="white" opacity="0.85"
              class="company-dot"
            />
          }
          <!-- Puntos de empresa (Centro) -->
          @for (p of getPoints('centro'); track $index) {
            <circle
              [attr.cx]="p.x" [attr.cy]="p.y" r="4"
              fill="white" opacity="0.85"
              class="company-dot"
            />
          }
          <!-- Puntos de empresa (Sur) -->
          @for (p of getPoints('sur'); track $index) {
            <circle
              [attr.cx]="p.x" [attr.cy]="p.y" r="4"
              fill="white" opacity="0.85"
              class="company-dot"
            />
          }
        </svg>

        <!-- Tooltip -->
        @if (hovered) {
          <div class="zone-tooltip">
            @for (z of zones; track z.zona) {
              @if (z.zona === hovered) {
                <div class="tooltip-content">
                  <p class="tooltip-label">{{ z.label }}</p>
                  <p class="tooltip-municipios">{{ z.municipios }}</p>
                  <p class="tooltip-count">
                    <strong>{{ z.empresas }}</strong> empresa{{ z.empresas !== 1 ? 's' : '' }}
                  </p>
                  <div class="tooltip-bar">
                    <div class="tooltip-fill" [style.width]="z.porcentaje + '%'"></div>
                  </div>
                </div>
              }
            }
          </div>
        }
      </div>

      <!-- Leyenda lateral -->
      <div class="legend">
        @for (z of zones; track z.zona) {
          <div
            class="legend-item"
            [class.active]="hovered === z.zona"
            (mouseenter)="hovered = z.zona"
            (mouseleave)="hovered = null"
          >
            <div class="legend-swatch" [style.background]="getColor(z.zona)" [style.opacity]="getOpacity(z.zona)"></div>
            <div class="legend-info">
              <span class="legend-label">{{ z.label }}</span>
              <span class="legend-count">{{ z.empresas }} empresas</span>
            </div>
            <div class="legend-pct">{{ z.porcentaje }}%</div>
          </div>
        }

        <div class="legend-note">
          <i class="pi pi-circle-fill"></i>
          <span>Cada punto representa una empresa</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./zone-heatmap.component.scss']
})
export class ZoneHeatmapComponent {
  @Input() zones: ZoneData[] = [
    { zona: 'norte', label: 'Zona Norte',  municipios: 'Acaponeta · Santiago Ixcuintla · Tuxpan', empresas: 38, porcentaje: 88 },
    { zona: 'centro', label: 'Zona Centro', municipios: 'Tepic · Xalisco · Bahía de Banderas', empresas: 4,  porcentaje: 9  },
    { zona: 'sur',   label: 'Zona Sur',    municipios: 'Compostela · San Blas',                empresas: 1,  porcentaje: 2  },
  ];

  hovered: string | null = null;

  private readonly COLORS = { norte: '#03837b', centro: '#3b82f6', sur: '#8b5cf6' };

  private readonly NORTH_POINTS = [
    {x:60,y:35},{x:80,y:25},{x:100,y:40},{x:120,y:30},{x:135,y:55},
    {x:75,y:60},{x:95,y:55},{x:50,y:65},{x:110,y:70},{x:130,y:45},
    {x:65,y:80},{x:85,y:85},{x:105,y:80},{x:55,y:45},{x:40,y:65},
    {x:115,y:60},{x:75,y:90},{x:95,y:92},{x:125,y:85},{x:45,y:78},
  ];
  private readonly CENTER_POINTS = [
    {x:70,y:120},{x:90,y:130},{x:110,y:125},{x:80,y:148},{x:100,y:155},
  ];
  private readonly SOUTH_POINTS = [
    {x:90,y:195},
  ];

  getColor(zona: string): string {
    return this.COLORS[zona as keyof typeof this.COLORS] ?? '#9ca3af';
  }

  getOpacity(zona: string): number {
    if (!this.hovered) {
      const z = this.zones.find(z => z.zona === zona);
      const max = Math.max(...this.zones.map(z => z.empresas));
      return 0.3 + ((z?.empresas ?? 0) / max) * 0.65;
    }
    return this.hovered === zona ? 0.9 : 0.2;
  }

  getPoints(zona: string): { x: number; y: number }[] {
    const z = this.zones.find(z => z.zona === zona);
    if (!z) return [];
    const pool = zona === 'norte' ? this.NORTH_POINTS
               : zona === 'centro' ? this.CENTER_POINTS
               : this.SOUTH_POINTS;
    return pool.slice(0, Math.min(z.empresas, pool.length));
  }
}
