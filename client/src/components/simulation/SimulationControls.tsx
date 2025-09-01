import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SimulationConfig } from "@/lib/simulation";
import { useState, useCallback } from "react";

interface SimulationControlsProps {
  config: SimulationConfig;
  setConfig: (config: SimulationConfig) => void;
  onRunSimulation: () => void;
  onExtendSimulation: () => void;
  onExportCsv: () => void;
  isRunning: boolean;
  canExtend: boolean;
}

export default function SimulationControls({
  config,
  setConfig,
  onRunSimulation,
  onExtendSimulation,
  onExportCsv,
  isRunning,
  canExtend
}: SimulationControlsProps) {
  const updateConfig = (key: keyof SimulationConfig, value: any) => {
    setConfig({ ...config, [key]: value });
  };

  const updateNestedConfig = (parent: string, key: string, value: number) => {
    setConfig({
      ...config,
      [parent]: {
        ...(config[parent as keyof SimulationConfig] as any),
        [key]: value
      }
    });
  };

  const TooltipInput = ({ 
    label, 
    tooltip, 
    id, 
    value, 
    onChange, 
    min, 
    max, 
    step = 0.01,
    type = "number"
  }: {
    label: string;
    tooltip: string;
    id: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    type?: string;
  }) => {
    const [localValue, setLocalValue] = useState(value.toString());
    
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalValue(val);
      
      // Only update parent state if we have a valid number
      const num = parseFloat(val);
      if (!isNaN(num) && val !== '' && val !== '-' && val !== '.') {
        onChange(num);
      }
    }, [onChange]);
    
    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const num = parseFloat(val);
      
      if (isNaN(num) || val === '' || val === '-' || val === '.') {
        // Reset to parent value if invalid
        setLocalValue(value.toString());
      } else {
        // Ensure parent state is updated and format the display
        onChange(num);
        setLocalValue(num.toString());
      }
    }, [onChange, value]);
    
    // Update local value when parent value changes
    const handleFocus = useCallback(() => {
      setLocalValue(value.toString());
    }, [value]);
    
    return (
      <div className="tooltip relative" data-title={tooltip}>
        <Label htmlFor={id} className="block text-sm font-medium text-muted-foreground mb-2">
          {label}
        </Label>
        <Input
          id={id}
          data-testid={`input-${id}`}
          type={type}
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className="w-full bg-input border-border text-foreground"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Simulation Controls */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-accent">🛠️ Simulation Controls</h2>
          <Badge variant="outline" className="text-xs">hover ℹ️ for math</Badge>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TooltipInput
              label="Users 👥"
              tooltip="Number of agents (users). Larger N smooths averages but is slower."
              id="users"
              value={config.usersN}
              onChange={(value) => updateConfig('usersN', Math.round(value))}
              min={5}
              max={5000}
              step={1}
            />
            <TooltipInput
              label="Rounds (initial) 🔁"
              tooltip="How many posting rounds to simulate on Run. Use ➕ to extend later."
              id="rounds"
              value={config.rounds}
              onChange={(value) => updateConfig('rounds', Math.round(value))}
              min={5}
              max={500}
              step={1}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TooltipInput
              label="Learning Rate 🧠"
              tooltip="Learning rate in the strategy update: s ← s + lr * adj * (post − s). Higher = faster adaptation/overfitting. Typical 0.05–0.3."
              id="learnRate"
              value={config.learnRate}
              onChange={(value) => updateConfig('learnRate', value)}
              min={0}
              max={1}
            />
            <TooltipInput
              label="Bait Ratio Threshold 🚩"
              tooltip="If bait_flags / interactions ≥ threshold, we scale down engagement probs by the Bait Penalty Multiplier. Typical 0.08–0.2."
              id="baitRatioThresh"
              value={config.baitRatioThresh}
              onChange={(value) => updateConfig('baitRatioThresh', value)}
              min={0.01}
              max={0.8}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <TooltipInput
              label="Bait Penalty Multiplier 🧯"
              tooltip="Multiplier applied to reaction/comment probs AFTER crossing the bait threshold. 1.0 = no penalty, 0.0 = full shutdown (harsh). 0.2–0.6 is common."
              id="baitPenaltyMult"
              value={config.baitPenaltyMult}
              onChange={(value) => updateConfig('baitPenaltyMult', value)}
              min={0}
              max={1}
              step={0.05}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TooltipInput
              label="Base Reach Min 📡"
              tooltip="Base exposure budget per post before attribute/follower effects."
              id="reachMin"
              value={config.reachMin}
              onChange={(value) => updateConfig('reachMin', Math.round(value))}
              min={1}
              max={10000}
              step={1}
            />
            <TooltipInput
              label="Base Reach Max 📡"
              tooltip="Upper bound for base exposure before effects."
              id="reachMax"
              value={config.reachMax}
              onChange={(value) => updateConfig('reachMax', Math.round(value))}
              min={1}
              max={10000}
              step={1}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TooltipInput
              label="Vibe Flag Multiplier 🏷️"
              tooltip="If Vibe tag is on, we multiply bait flag probability by this (lower is more protective). 0.5–0.8 typical."
              id="vibeFlagMult"
              value={config.vibeFlagMult}
              onChange={(value) => updateConfig('vibeFlagMult', value)}
              min={0.1}
              max={1}
              step={0.05}
            />
            <TooltipInput
              label="Polarization Coupling ⚖️"
              tooltip="Couples extremes: more SA makes SD more likely and vice versa. 0 = off, 0.1–0.2 = moderate, 0.4+ = intense polarization."
              id="polarCoupling"
              value={config.polarCoupling}
              onChange={(value) => updateConfig('polarCoupling', value)}
              min={0}
              max={0.5}
            />
          </div>
        </div>
      </Card>

      {/* Vibe Effects */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-accent mb-4">🏷️ Vibe Effects</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TooltipInput
              label="Vibe Humor Penalty 🤐"
              tooltip="When Vibe is on: humor *= (1 − x). 0.15 reduces humor by 15% to steer earnest tone."
              id="vibeHumorPenalty"
              value={config.vibeHumorPenalty}
              onChange={(value) => updateConfig('vibeHumorPenalty', value)}
              min={0}
              max={0.9}
              step={0.05}
            />
            <TooltipInput
              label="Vibe Controversy Penalty 🧊"
              tooltip="When Vibe is on: controversy *= (1 − x). 0.25 trims spiciness by 25%."
              id="vibeControversyPenalty"
              value={config.vibeControversyPenalty}
              onChange={(value) => updateConfig('vibeControversyPenalty', value)}
              min={0}
              max={0.9}
              step={0.05}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TooltipInput
              label="Vibe Insight Boost 🧠✨"
              tooltip="When Vibe is on: insight *= (1 + x). 0.20 = +20%."
              id="vibeInsightBoost"
              value={config.vibeInsightBoost}
              onChange={(value) => updateConfig('vibeInsightBoost', value)}
              min={0}
              max={1}
              step={0.05}
            />
            <TooltipInput
              label="Vibe Comment Boost 💬⬆️"
              tooltip="When Vibe is on: commentProb *= (1 + x). 0.20 adds 20% more comments."
              id="vibeCommentBoost"
              value={config.vibeCommentBoost}
              onChange={(value) => updateConfig('vibeCommentBoost', value)}
              min={0}
              max={1}
              step={0.05}
            />
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <TooltipInput
              label="Base Vibe Probability 🎯"
              tooltip="Starting probability for Normal users to use vibe tags. They'll learn from here. 0.05 = 5% chance initially."
              id="baseVibeProb"
              value={config.baseVibeProb}
              onChange={(value) => updateConfig('baseVibeProb', value)}
              min={0}
              max={1}
              step={0.01}
            />
          </div>
        </div>
      </Card>

      {/* Network & Homophily */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-accent mb-4">🌐 Network & Homophily</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TooltipInput
              label="Initial Followers Mean 👣"
              tooltip="Initial mean followers drawn from a noisy normal distribution."
              id="followersMean"
              value={config.followersMean}
              onChange={(value) => updateConfig('followersMean', Math.round(value))}
              min={0}
              max={100000}
              step={10}
            />
            <TooltipInput
              label="Follower→Reach Factor 📈"
              tooltip="Diminishing returns: reach *= (1 + factor·log10(1+followers)). 0.10–0.25 typical."
              id="followerReachFactor"
              value={config.followerReachFactor}
              onChange={(value) => updateConfig('followerReachFactor', value)}
              min={0}
              max={1}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TooltipInput
              label="Global Audience K 🌍"
              tooltip="Larger K ⇒ more local (follower) views before global spillover."
              id="globalAudienceK"
              value={config.globalAudienceK}
              onChange={(value) => updateConfig('globalAudienceK', Math.round(value))}
              min={10}
              max={100000}
              step={10}
            />
            <TooltipInput
              label="Homophily Strength 🫧"
              tooltip="Tilt local audience toward agreement. 0=no bubble; 1=strong bubble."
              id="homophilyStrength"
              value={config.homophilyStrength}
              onChange={(value) => updateConfig('homophilyStrength', value)}
              min={0}
              max={1}
              step={0.05}
            />
          </div>
        </div>
      </Card>

      {/* Reaction Weights */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-accent mb-4">🎯 Reaction Weights (base blend)</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TooltipInput
              label="Strong Agree 💚"
              tooltip="Base utility weight for Strong Agree in reward. Type-specific utilities are blended 50/50 with these."
              id="wSA"
              value={config.w.strong_agree}
              onChange={(value) => updateNestedConfig('w', 'strong_agree', value)}
              min={-2}
              max={3}
              step={0.1}
            />
            <TooltipInput
              label="Agree 👍"
              tooltip="Base utility for Agree."
              id="wA"
              value={config.w.agree}
              onChange={(value) => updateNestedConfig('w', 'agree', value)}
              min={-2}
              max={3}
              step={0.1}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TooltipInput
              label="Not Sure 🤔"
              tooltip="Base utility for Not Sure (can be positive if you want to reward nuance)."
              id="wNS"
              value={config.w.not_sure}
              onChange={(value) => updateNestedConfig('w', 'not_sure', value)}
              min={-2}
              max={3}
              step={0.1}
            />
            <TooltipInput
              label="Disagree 👎"
              tooltip="Base utility for Disagree."
              id="wD"
              value={config.w.disagree}
              onChange={(value) => updateNestedConfig('w', 'disagree', value)}
              min={-2}
              max={3}
              step={0.1}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <TooltipInput
              label="Strong Disagree 💔"
              tooltip="Base utility for Strong Disagree. Negative usually."
              id="wSD"
              value={config.w.strong_disagree}
              onChange={(value) => updateNestedConfig('w', 'strong_disagree', value)}
              min={-2}
              max={3}
              step={0.1}
            />
          </div>
        </div>
      </Card>

      {/* User Type Mix */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-accent mb-4">🧬 User Type Mix (%)</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TooltipInput
              label="Normal 🙂"
              tooltip="Baseline balanced actors."
              id="pctNormal"
              value={config.mix.Normal}
              onChange={(value) => updateNestedConfig('mix', 'Normal', Math.round(value))}
              min={0}
              max={100}
              step={1}
            />
            <TooltipInput
              label="Joker 😆"
              tooltip="Comedy & dunks."
              id="pctJoker"
              value={config.mix.Joker}
              onChange={(value) => updateNestedConfig('mix', 'Joker', Math.round(value))}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TooltipInput
              label="Troll 😈"
              tooltip="Spicy & bait-prone."
              id="pctTroll"
              value={config.mix.Troll}
              onChange={(value) => updateNestedConfig('mix', 'Troll', Math.round(value))}
              min={0}
              max={100}
              step={1}
            />
            <TooltipInput
              label="Intellectual 🧐"
              tooltip="Insight & news oriented."
              id="pctIntel"
              value={config.mix.Intellectual}
              onChange={(value) => updateNestedConfig('mix', 'Intellectual', Math.round(value))}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <TooltipInput
              label="Journalist 📝"
              tooltip="High news propensity, high vibe usage."
              id="pctJourno"
              value={config.mix.Journalist}
              onChange={(value) => updateNestedConfig('mix', 'Journalist', Math.round(value))}
              min={0}
              max={100}
              step={1}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Totals auto-normalize to 100%.</p>
      </Card>

      {/* Post Attribute Boosts */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-accent mb-4">🧪 Post Attribute Boosts (−1 to +1)</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TooltipInput
              label="Boost Humor 😹"
              tooltip="Multiply humor by (1 + x). −1..+1. Set negative to de-boost."
              id="boostHumor"
              value={config.boosts.humor}
              onChange={(value) => updateNestedConfig('boosts', 'humor', value)}
              min={-1}
              max={1}
              step={0.05}
            />
            <TooltipInput
              label="Boost Insight 🧠"
              tooltip="Multiply insight by (1 + x)."
              id="boostInsight"
              value={config.boosts.insight}
              onChange={(value) => updateNestedConfig('boosts', 'insight', value)}
              min={-1}
              max={1}
              step={0.05}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TooltipInput
              label="Boost Bait 🪤"
              tooltip="Multiply bait by (1 + x). Use negative to de-boost bait."
              id="boostBait"
              value={config.boosts.bait}
              onChange={(value) => updateNestedConfig('boosts', 'bait', value)}
              min={-1}
              max={1}
              step={0.05}
            />
            <TooltipInput
              label="Boost Controversy 🌶️"
              tooltip="Multiply controversy by (1 + x)."
              id="boostControversy"
              value={config.boosts.controversy}
              onChange={(value) => updateNestedConfig('boosts', 'controversy', value)}
              min={-1}
              max={1}
              step={0.05}
            />
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          data-testid="button-run-simulation"
          onClick={onRunSimulation}
          disabled={isRunning}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isRunning ? '⏳ Running...' : '▶ Run Simulation'}
        </Button>
        
        <Button
          data-testid="button-extend-simulation"
          onClick={onExtendSimulation}
          disabled={!canExtend || isRunning}
          variant="secondary"
        >
          ➕ Run 10 More Rounds
        </Button>
        
        <Button
          data-testid="button-export-csv"
          onClick={onExportCsv}
          disabled={!canExtend}
          variant="outline"
        >
          ⭳ Export CSV
        </Button>
      </div>
    </div>
  );
}
