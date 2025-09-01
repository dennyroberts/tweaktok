import { useEffect, useRef } from "react";
import { SimulationState } from "@/lib/simulation";
import { ChartManager } from "@/lib/charts";

interface ChartDisplayProps {
  simulationState: SimulationState;
  chartId: string;
  chartType: 'reward' | 'bait' | 'agree' | 'followers' | 'attributes' | 'vibe';
  className?: string;
}

export default function ChartDisplay({ 
  simulationState, 
  chartId, 
  chartType, 
  className = "w-full h-40" 
}: ChartDisplayProps) {
  const chartManagerRef = useRef<ChartManager | null>(null);

  useEffect(() => {
    if (!chartManagerRef.current) {
      chartManagerRef.current = new ChartManager();
    }

    return () => {
      if (chartManagerRef.current) {
        chartManagerRef.current.destroy();
        chartManagerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (chartManagerRef.current && simulationState.roundsDone > 0) {
      setTimeout(() => {
        switch (chartType) {
          case 'reward':
            chartManagerRef.current?.updateRewardChart(simulationState);
            break;
          case 'bait':
            chartManagerRef.current?.updateBaitChart(simulationState);
            break;
          case 'agree':
            chartManagerRef.current?.updateAgreeChart(simulationState);
            break;
          case 'followers':
            chartManagerRef.current?.updateFollowersChart(simulationState);
            break;
          case 'attributes':
            chartManagerRef.current?.updateAttributesChart(simulationState);
            break;
          case 'vibe':
            chartManagerRef.current?.updateVibeCharts(simulationState);
            break;
        }
      }, 100);
    }
  }, [simulationState, chartType]);

  return (
    <canvas 
      id={chartId} 
      className={className}
      data-testid={`chart-${chartType}`}
    ></canvas>
  );
}
