import { useState, useEffect } from "react";
import SimulationControls from "@/components/simulation/SimulationControls";
import ResultsPanel from "@/components/simulation/ResultsPanel";
import { SimulationEngine, type SimulationConfig, type SimulationState } from "@/lib/simulation";

export default function Simulation() {
  const [simulation] = useState(() => new SimulationEngine());
  const [isRunning, setIsRunning] = useState(false);
  const [simulationState, setSimulationState] = useState<SimulationState>({
    users: [],
    rows: [],
    ref: 100,
    roundsDone: 0,
    seriesReward: [],
    seriesBait: [],
    seriesAttrs: [],
    seriesAttrsByType: {},
    seriesFollowersByType: {},
    seriesFollowersAll: [],
    seriesVibeOverall: [],
    seriesVibeByType: {},
    best: null
  });

  const [config, setConfig] = useState<SimulationConfig>({
    usersN: 120,
    rounds: 80,
    learnRate: 0.15,
    baitRatioThresh: 0.10,
    baitPenaltyMult: 0.20,
    reachMin: 30,
    reachMax: 150,
    vibeFlagMult: 0.6,
    polarCoupling: 0.12,
    vibeHumorPenalty: 0.15,
    vibeControversyPenalty: 0.25,
    vibeInsightBoost: 0.20,
    vibeCommentBoost: 0.20,
    vibeReachBoost: 0.10,
    followGainThresh: 1.30,
    followersMean: 200,
    followerReachFactor: 0.15,
    globalAudienceK: 4000,
    homophilyStrength: 0.35,
    viralityThreshold: 1500,
    localFloor: 0.20,
    followGainRate: 0.25,
    followLossRate: 0.30,
    w: {
      strong_agree: 1.0,
      agree: 0.8,
      not_sure: 0.2,
      disagree: 0.0,
      strong_disagree: -0.6
    },
    boosts: {
      humor: 0.00,
      insight: 0.00,
      bait: 0.00,
      controversy: 0.00,
      news: 0.00,
      dunk: 0.00
    },
    mix: {
      Normal: 55,
      Joker: 10,
      Troll: 10,
      Intellectual: 15,
      Journalist: 10
    },
    baseVibeProb: 0.05,
    maWindow: 10
  });

  const handleRunSimulation = async (updatedConfig?: SimulationConfig) => {
    const configToUse = updatedConfig || config;
    console.log('🏃 Simulation Page: handleRunSimulation called with config:', configToUse);
    console.log('🏃 Simulation Page: Rounds from config:', configToUse.rounds);
    setIsRunning(true);
    try {
      const state = simulation.startSimulation(configToUse);
      console.log('🏃 Simulation Page: Simulation completed with rounds done:', state.roundsDone);
      setSimulationState(state);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExtendSimulation = async (updatedConfig?: SimulationConfig) => {
    if (simulationState.roundsDone === 0) {
      return;
    }
    
    console.log('🏃 Simulation Page: handleExtendSimulation called with config:', updatedConfig || 'using existing config');
    setIsRunning(true);
    try {
      const state = simulation.runMoreRounds(10);
      setSimulationState(state);
    } catch (error) {
      console.error('Simulation extension failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportCsv = () => {
    simulation.exportCsv();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🧪</div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Social Platform Sandbox — v5</h1>
              <p className="text-sm text-muted-foreground">Network & homophily • vibe dynamics • type utilities • bait ratio penalty</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              hover ℹ️ for math
            </span>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-6 p-6 max-w-[1800px] mx-auto">
        <SimulationControls
          config={config}
          setConfig={setConfig}
          onRunSimulation={handleRunSimulation}
          onExtendSimulation={handleExtendSimulation}
          onExportCsv={handleExportCsv}
          isRunning={isRunning}
          canExtend={simulationState.roundsDone > 0}
        />
        
        <ResultsPanel
          simulationState={simulationState}
          isRunning={isRunning}
        />
      </div>
      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="px-6 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Toy model for incentive tuning. Don't overfit! © You.
          </p>
        </div>
      </footer>
    </div>
  );
}
