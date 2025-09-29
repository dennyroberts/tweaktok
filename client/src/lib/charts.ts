import { Chart, registerables } from 'chart.js';
import { SimulationState } from './simulation';
import { USER_TYPES } from './simulation';

Chart.register(...registerables);

export class ChartManager {
  private charts: Record<string, Chart> = {};

  private getChartColors() {
    return {
      primary: 'hsl(193, 100%, 76%)',
      green: 'hsl(127, 65%, 70%)',
      orange: 'hsl(42, 100%, 77%)',
      red: 'hsl(0, 100%, 77%)',
      blue: 'hsl(215, 100%, 74%)',
      pink: 'hsl(326, 100%, 80%)',
      text: 'hsl(213, 31%, 91%)',
      muted: 'hsl(217, 24%, 59%)'
    };
  }

  private getDefaultChartOptions() {
    const colors = this.getChartColors();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: colors.text,
            font: {
              size: 12
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: colors.muted,
            font: {
              size: 11
            }
          },
          grid: {
            color: 'hsl(217, 33%, 17%)'
          }
        },
        y: {
          ticks: {
            color: colors.muted,
            font: {
              size: 11
            }
          },
          grid: {
            color: 'hsl(217, 33%, 17%)'
          }
        }
      }
    };
  }

  private movingAvg(arr: number[], w: number): number[] {
    if (w <= 1) return [...arr];
    const out: number[] = [];
    for (let i = 0; i < arr.length; i++) {
      let s = 0, c = 0;
      for (let j = Math.max(0, i - w + 1); j <= i; j++) {
        s += arr[j];
        c++;
      }
      out.push(s / c);
    }
    return out;
  }

  private getCanvasDimensions(canvas: HTMLCanvasElement): { width: number; height: number } {
    const rect = canvas.getBoundingClientRect();
    
    // Use smaller, fixed dimensions to prevent canvas size errors
    // The responsive: true option will handle scaling
    return {
      width: Math.min(800, Math.max(300, rect.width)),
      height: Math.min(400, Math.max(150, rect.height))
    };
  }

  initializeChart(canvasId: string, type: 'line' | 'bar' | 'doughnut', data: any, options?: any): Chart {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas with id ${canvasId} not found`);
    }

    // Destroy existing chart if it exists
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    // Reset canvas size to prevent issues
    canvas.style.width = '';
    canvas.style.height = '';

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error(`Could not get 2D context for canvas ${canvasId}`);
    }

    const defaultOptions = this.getDefaultChartOptions();
    const chart = new Chart(ctx, {
      type,
      data,
      options: { 
        ...defaultOptions, 
        ...options,
        animation: {
          duration: 200 // Reduce animation time for better performance
        },
        elements: {
          point: {
            radius: 2 // Smaller points for better performance
          }
        }
      }
    });

    this.charts[canvasId] = chart;
    return chart;
  }

  updateRewardChart(state: SimulationState): void {
    const colors = this.getChartColors();
    const labels = Array.from({ length: state.seriesReward.length }, (_, i) => i + 1);
    const ma = this.movingAvg(state.seriesReward, 10);

    this.initializeChart('chartReward', 'line', {
      labels,
      datasets: [
        {
          label: 'Avg Reward (MA-10)',
          data: ma,
          borderColor: colors.orange,
          backgroundColor: colors.orange + '20',
          borderWidth: 3,
          fill: false
        }
      ]
    });
  }

  updateBaitChart(state: SimulationState): void {
    const colors = this.getChartColors();
    const labels = Array.from({ length: state.seriesBait.length }, (_, i) => i + 1);
    const ma = this.movingAvg(state.seriesBait, 10);

    this.initializeChart('chartBait', 'line', {
      labels,
      datasets: [
        {
          label: 'Avg Bait Flags (MA-10)',
          data: ma,
          borderColor: colors.red,
          backgroundColor: colors.red + '20',
          borderWidth: 3,
          fill: false
        }
      ]
    });
  }

  updateAgreeChart(state: SimulationState): void {
    const colors = this.getChartColors();
    
    // Calculate agreement ratios from rows
    const agreementByRound: Record<number, { sa: number, a: number, total: number }> = {};
    
    state.rows.forEach(row => {
      if (!agreementByRound[row.round]) {
        agreementByRound[row.round] = { sa: 0, a: 0, total: 0 };
      }
      agreementByRound[row.round].sa += row.strong_agree;
      agreementByRound[row.round].a += row.agree;
      agreementByRound[row.round].total += row.strong_agree + row.agree + row.not_sure + row.disagree + row.strong_disagree;
    });

    const rounds = Object.keys(agreementByRound).map(Number).sort((a, b) => a - b);
    const saRatios = rounds.map(r => {
      const data = agreementByRound[r];
      return data.total > 0 ? data.sa / data.total : 0;
    });
    const aRatios = rounds.map(r => {
      const data = agreementByRound[r];
      return data.total > 0 ? data.a / data.total : 0;
    });

    // Apply moving averages
    const saMA = this.movingAvg(saRatios, 10);
    const aMA = this.movingAvg(aRatios, 10);

    this.initializeChart('chartAgree', 'line', {
      labels: rounds,
      datasets: [
        {
          label: 'Strong Agree % (MA-10)',
          data: saMA,
          borderColor: colors.green,
          backgroundColor: colors.green + '20',
          borderWidth: 3,
          fill: false
        },
        {
          label: 'Agree % (MA-10)',
          data: aMA,
          borderColor: colors.blue,
          backgroundColor: colors.blue + '20',
          borderWidth: 3,
          fill: false
        }
      ]
    }, {
      scales: {
        y: {
          ticks: {
            color: this.getChartColors().muted,
            callback: function(value: any) {
              return (value * 100).toFixed(1) + '%';
            }
          },
          grid: {
            color: 'hsl(217, 33%, 17%)'
          }
        },
        x: {
          ticks: {
            color: this.getChartColors().muted
          },
          grid: {
            color: 'hsl(217, 33%, 17%)'
          }
        }
      }
    });
  }

  updateFollowersChart(state: SimulationState): void {
    // Skip creating the total followers chart - just update individual type charts
    this.updateFollowersByTypeCharts(state);
  }

  updateFollowersByTypeCharts(state: SimulationState): void {
    const colors = this.getChartColors();
    const typeColors = [colors.primary, colors.green, colors.orange, colors.red, colors.blue];

    // Find the maximum length across all series to create consistent labels
    const maxLength = Math.max(...USER_TYPES.map(type => (state.seriesFollowersByType[type] || []).length));
    const labels = Array.from({ length: maxLength }, (_, i) => i + 1);

    const datasets = USER_TYPES.map((type, index) => {
      const rawData = state.seriesFollowersByType[type] || [];
      const ma = this.movingAvg(rawData, 10);
      
      return {
        label: `${type} (MA-10)`,
        data: ma,
        borderColor: typeColors[index],
        backgroundColor: typeColors[index] + '20',
        borderWidth: 3,
        fill: false,
        tension: 0.1
      };
    });

    this.initializeChart('chartFollowersCombined', 'line', {
      labels,
      datasets
    }, {
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: this.getChartColors().text,
            font: {
              size: 12
            },
            usePointStyle: true,
            pointStyle: 'line'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: this.getChartColors().muted
          },
          grid: {
            color: 'hsl(217, 33%, 17%)'
          }
        },
        x: {
          ticks: {
            color: this.getChartColors().muted
          },
          grid: {
            color: 'hsl(217, 33%, 17%)'
          }
        }
      }
    });
  }

  updateAttributesChart(state: SimulationState): void {
    const colors = this.getChartColors();
    const attrColors = [colors.green, colors.blue, colors.orange, colors.red, colors.pink, colors.primary];
    const labels = Array.from({ length: state.seriesAttrs.length }, (_, i) => i + 1);

    const datasets = ['humor', 'insight', 'bait', 'controversy', 'news', 'dunk'].map((attr, index) => ({
      label: attr,
      data: state.seriesAttrs.map(round => round[index] || 0),
      borderColor: attrColors[index],
      backgroundColor: attrColors[index] + '20',
      borderWidth: 2,
      fill: false
    }));

    this.initializeChart('chartAttrsOverall', 'line', {
      labels,
      datasets
    });
  }

  updateVibeCharts(state: SimulationState): void {
    const colors = this.getChartColors();
    const labels = Array.from({ length: state.seriesVibeOverall.length }, (_, i) => i + 1);

    // Overall vibe usage
    this.initializeChart('chartVibeOverall', 'line', {
      labels,
      datasets: [
        {
          label: 'Vibe Usage %',
          data: state.seriesVibeOverall,
          borderColor: colors.primary,
          backgroundColor: colors.primary + '20',
          borderWidth: 2,
          fill: true
        }
      ]
    }, {
      scales: {
        y: {
          ticks: {
            color: this.getChartColors().muted,
            callback: function(value: any) {
              return (value * 100).toFixed(1) + '%';
            }
          },
          grid: {
            color: 'hsl(217, 33%, 17%)'
          }
        },
        x: {
          ticks: {
            color: this.getChartColors().muted
          },
          grid: {
            color: 'hsl(217, 33%, 17%)'
          }
        }
      }
    });

    // Vibe usage by type with moving averages
    const typeColors = [colors.primary, colors.green, colors.orange, colors.red, colors.blue];
    const vibeDatasets = USER_TYPES.map((type, index) => {
      const rawData = state.seriesVibeByType[type] || [];
      const ma = this.movingAvg(rawData, 10);
      return {
        label: `${type} Vibe % (MA-10)`,
        data: ma,
        borderColor: typeColors[index],
        backgroundColor: typeColors[index] + '20',
        borderWidth: 3,
        fill: false
      };
    });

    this.initializeChart('chartVibeByType', 'line', {
      labels,
      datasets: vibeDatasets
    }, {
      scales: {
        y: {
          ticks: {
            color: this.getChartColors().muted,
            callback: function(value: any) {
              return (value * 100).toFixed(1) + '%';
            }
          },
          grid: {
            color: 'hsl(217, 33%, 17%)'
          }
        },
        x: {
          ticks: {
            color: this.getChartColors().muted
          },
          grid: {
            color: 'hsl(217, 33%, 17%)'
          }
        }
      }
    });
  }

  updateAttributesByTypeChart(state: SimulationState, selectedAttribute: string, visibleTypes: Set<string>): void {
    const colors = this.getChartColors();
    const typeColors = [colors.primary, colors.green, colors.orange, colors.red, colors.blue];
    const attrIndex = ['humor', 'insight', 'bait', 'controversy', 'news', 'dunk'].indexOf(selectedAttribute);
    
    if (attrIndex === -1) return;

    const labels = Array.from({ length: state.seriesAttrs.length }, (_, i) => i + 1);
    const datasets = USER_TYPES.filter(type => visibleTypes.has(type)).map((type, index) => ({
      label: type,
      data: state.seriesAttrsByType[type]?.map(round => round[attrIndex] || 0) || [],
      borderColor: typeColors[index],
      backgroundColor: typeColors[index] + '20',
      borderWidth: 2,
      fill: false
    }));

    this.initializeChart('chartAttrsByType', 'line', {
      labels,
      datasets
    });
  }

  updateTypeMixChart(state: SimulationState, selectedType: string): void {
    const colors = this.getChartColors();
    const attrColors = [colors.green, colors.blue, colors.orange, colors.red, colors.pink, colors.primary];
    const typeData = state.seriesAttrsByType[selectedType as keyof typeof state.seriesAttrsByType];
    
    if (!typeData) return;

    const labels = Array.from({ length: typeData.length }, (_, i) => i + 1);
    const datasets = ['humor', 'insight', 'bait', 'controversy', 'news', 'dunk'].map((attr, index) => ({
      label: attr,
      data: typeData.map(round => round[index] || 0),
      borderColor: attrColors[index],
      backgroundColor: attrColors[index] + '20',
      borderWidth: 2,
      fill: false
    }));

    this.initializeChart('chartTypeMix', 'line', {
      labels,
      datasets
    });
  }

  updateAllCharts(state: SimulationState): void {
    this.updateRewardChart(state);
    this.updateBaitChart(state);
    this.updateAgreeChart(state);
    this.updateFollowersChart(state);
    this.updateAttributesChart(state);
    this.updateVibeCharts(state);
  }

  destroy(): void {
    Object.values(this.charts).forEach(chart => chart.destroy());
    this.charts = {};
  }
}
