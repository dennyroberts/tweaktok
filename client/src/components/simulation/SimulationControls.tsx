import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SimulationConfig } from "@/lib/simulation";
import { useState, useCallback, memo, useEffect, useRef } from "react";

interface SimulationControlsProps {
  config: SimulationConfig;
  setConfig: (config: SimulationConfig | ((prev: SimulationConfig) => SimulationConfig)) => void;
  onRunSimulation: () => void;
  onExtendSimulation: () => void;
  onExportCsv: () => void;
  isRunning: boolean;
  canExtend: boolean;
}

// Stable input component - defined once, never recreated
const StableInput = memo(function StableInput({ 
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
}) {
  // Use a stable ref to maintain the same input element
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalValue, setInternalValue] = useState(value.toString());
  
  // Only update when external value actually changes
  useEffect(() => {
    if (value.toString() !== internalValue) {
      setInternalValue(value.toString());
    }
  }, [value, internalValue]);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    
    // Parse and validate without triggering immediate parent updates
    const num = parseFloat(newValue);
    if (!isNaN(num) && newValue.trim() !== '') {
      // Use setTimeout to batch the update and prevent immediate re-renders
      setTimeout(() => onChange(num), 0);
    }
  }, [onChange]);
  
  return (
    <div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Label htmlFor={id} className="block text-sm font-medium text-muted-foreground mb-2 cursor-help">
            {label} ℹ️
          </Label>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
      <Input
        ref={inputRef}
        id={id}
        data-testid={`input-${id}`}
        type={type}
        min={min}
        max={max}
        step={step}
        value={internalValue}
        onChange={handleChange}
        className="w-full bg-input border-border text-foreground"
      />
    </div>
  );
});

export default function SimulationControls({
  config,
  setConfig,
  onRunSimulation,
  onExtendSimulation,
  onExportCsv,
  isRunning,
  canExtend
}: SimulationControlsProps) {
  // Local state for all form values - no immediate updates
  const [localConfig, setLocalConfig] = useState(config);
  
  // Update local config when parent config changes (like on simulation start)
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);
  
  const updateLocalConfig = useCallback((key: keyof SimulationConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateLocalNestedConfig = useCallback((parent: string, key: string, value: number) => {
    setLocalConfig(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof SimulationConfig] as any),
        [key]: value
      }
    }));
  }, []);
  
  const applyChanges = useCallback(() => {
    setConfig(localConfig);
  }, [localConfig, setConfig]);


  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Main Simulation Controls */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-accent">🛠️ Simulation Controls</h2>
              <Badge variant="outline" className="text-xs">hover ℹ️ for details</Badge>
            </div>
            <Button 
              onClick={applyChanges} 
              variant="outline" 
              size="sm"
              data-testid="button-update-main"
            >
              Update Variables
            </Button>
          </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StableInput
              label="Users 👥"
              tooltip="Number of agents (users). Larger N smooths averages but is slower."
              id="users"
              value={localConfig.usersN}
              onChange={(value) => updateLocalConfig('usersN', Math.round(value))}
              min={5}
              max={5000}
              step={1}
            />
            <StableInput
              label="Rounds (initial) 🔁"
              tooltip="How many posting rounds to simulate on Run. Use ➕ to extend later."
              id="rounds"
              value={localConfig.rounds}
              onChange={(value) => updateLocalConfig('rounds', Math.round(value))}
              min={5}
              max={500}
              step={1}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StableInput
              label="Learning Rate 🧠"
              tooltip="How quickly users adapt their posting strategy based on feedback. Higher values = users change their behavior faster based on what gets engagement. Lower values = more stable, slower learning."
              id="learnRate"
              value={localConfig.learnRate}
              onChange={(value) => updateLocalConfig('learnRate', value)}
              min={0}
              max={1}
            />
            <StableInput
              label="Bait Ratio Threshold 🚩"
              tooltip="Users can flag posts as 'bait' (low-quality engagement farming). If enough people agree a post is bait (ratio crosses this threshold), we reduce that post's engagement reach. Think of it as community-driven content moderation."
              id="baitRatioThresh"
              value={localConfig.baitRatioThresh}
              onChange={(value) => updateLocalConfig('baitRatioThresh', value)}
              min={0.01}
              max={0.8}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <StableInput
              label="Bait Penalty Multiplier 🧯"
              tooltip="Once a post is flagged as bait, this controls how much we reduce its engagement. 1.0 = no reduction, 0.5 = half the engagement, 0.0 = completely hidden. Lower values are harsher penalties."
              id="baitPenaltyMult"
              value={localConfig.baitPenaltyMult}
              onChange={(value) => updateLocalConfig('baitPenaltyMult', value)}
              min={0}
              max={1}
              step={0.05}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StableInput
              label="Base Reach Min 📡"
              tooltip="Base exposure budget per post before attribute/follower effects."
              id="reachMin"
              value={localConfig.reachMin}
              onChange={(value) => updateLocalConfig('reachMin', Math.round(value))}
              min={1}
              max={10000}
              step={1}
            />
            <StableInput
              label="Base Reach Max 📡"
              tooltip="Upper bound for base exposure before effects."
              id="reachMax"
              value={localConfig.reachMax}
              onChange={(value) => updateLocalConfig('reachMax', Math.round(value))}
              min={1}
              max={10000}
              step={1}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StableInput
              label="Vibe Flag Multiplier 🏷️"
              tooltip="When users add 'vibe' tags to their posts, this reduces how likely others are to flag it as bait. Think of it as a 'good faith discussion' label that provides some protection from being flagged."
              id="vibeFlagMult"
              value={localConfig.vibeFlagMult}
              onChange={(value) => updateLocalConfig('vibeFlagMult', value)}
              min={0.1}
              max={1}
              step={0.05}
            />
            <StableInput
              label="Polarization Coupling ⚖️"
              tooltip="Controls how much extreme reactions (strong agree/disagree) encourage more extreme reactions from others. Higher values create more polarized discussions where moderate responses become less common."
              id="polarCoupling"
              value={localConfig.polarCoupling}
              onChange={(value) => updateLocalConfig('polarCoupling', value)}
              min={0}
              max={0.5}
            />
          </div>
        </div>
      </Card>

      {/* Vibe Effects */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-accent">🏷️ Vibe Effects</h3>
          <Button 
            onClick={applyChanges} 
            variant="outline" 
            size="sm"
            data-testid="button-update-vibe"
          >
            Update Variables
          </Button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StableInput
              label="Vibe Humor Penalty 🤐"
              tooltip="When Vibe is on: humor *= (1 − x). 0.15 reduces humor by 15% to steer earnest tone."
              id="vibeHumorPenalty"
              value={localConfig.vibeHumorPenalty}
              onChange={(value) => updateLocalConfig('vibeHumorPenalty', value)}
              min={0}
              max={0.9}
              step={0.05}
            />
            <StableInput
              label="Vibe Controversy Penalty 🧊"
              tooltip="When Vibe is on: controversy *= (1 − x). 0.25 trims spiciness by 25%."
              id="vibeControversyPenalty"
              value={localConfig.vibeControversyPenalty}
              onChange={(value) => updateLocalConfig('vibeControversyPenalty', value)}
              min={0}
              max={0.9}
              step={0.05}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StableInput
              label="Vibe Insight Boost 🧠✨"
              tooltip="When Vibe is on: insight *= (1 + x). 0.20 = +20%."
              id="vibeInsightBoost"
              value={localConfig.vibeInsightBoost}
              onChange={(value) => updateLocalConfig('vibeInsightBoost', value)}
              min={0}
              max={1}
              step={0.05}
            />
            <StableInput
              label="Vibe Comment Boost 💬⬆️"
              tooltip="When Vibe is on: commentProb *= (1 + x). 0.20 adds 20% more comments."
              id="vibeCommentBoost"
              value={localConfig.vibeCommentBoost}
              onChange={(value) => updateLocalConfig('vibeCommentBoost', value)}
              min={0}
              max={1}
              step={0.05}
            />
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <StableInput
              label="Base Vibe Probability 🎯"
              tooltip="Starting probability for Normal users to use vibe tags. They'll learn from here. 0.05 = 5% chance initially."
              id="baseVibeProb"
              value={localConfig.baseVibeProb}
              onChange={(value) => updateLocalConfig('baseVibeProb', value)}
              min={0}
              max={1}
              step={0.01}
            />
          </div>
        </div>
      </Card>

      {/* Network & Homophily */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-accent">🌐 Network & Homophily</h3>
          <Button 
            onClick={applyChanges} 
            variant="outline" 
            size="sm"
            data-testid="button-update-network"
          >
            Update Variables
          </Button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StableInput
              label="Initial Followers Mean 👣"
              tooltip="Initial mean followers drawn from a noisy normal distribution."
              id="followersMean"
              value={localConfig.followersMean}
              onChange={(value) => updateLocalConfig('followersMean', Math.round(value))}
              min={0}
              max={100000}
              step={10}
            />
            <StableInput
              label="Follower→Reach Factor 📈"
              tooltip="Diminishing returns: reach *= (1 + factor·log10(1+followers)). 0.10–0.25 typical."
              id="followerReachFactor"
              value={localConfig.followerReachFactor}
              onChange={(value) => updateLocalConfig('followerReachFactor', value)}
              min={0}
              max={1}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StableInput
              label="Global Audience K 🌍"
              tooltip="Larger K ⇒ more local (follower) views before global spillover."
              id="globalAudienceK"
              value={localConfig.globalAudienceK}
              onChange={(value) => updateLocalConfig('globalAudienceK', Math.round(value))}
              min={10}
              max={100000}
              step={10}
            />
            <StableInput
              label="Homophily Strength 🫧"
              tooltip="How much users mainly see content from people who think like them. 0 = see diverse opinions, 1 = strong echo chamber where you mostly see agreement."
              id="homophilyStrength"
              value={localConfig.homophilyStrength}
              onChange={(value) => updateLocalConfig('homophilyStrength', value)}
              min={0}
              max={1}
              step={0.05}
            />
          </div>
        </div>
      </Card>

      {/* Reaction Weights */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-accent">🎯 Reaction Weights (base blend)</h3>
          <Button 
            onClick={applyChanges} 
            variant="outline" 
            size="sm"
            data-testid="button-update-reactions"
          >
            Update Variables
          </Button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StableInput
              label="Strong Agree 💚"
              tooltip="How rewarding it feels to get 'Strong Agree' reactions. Positive values make users want more strong agreement on their posts."
              id="wSA"
              value={localConfig.w.strong_agree}
              onChange={(value) => updateLocalNestedConfig('w', 'strong_agree', value)}
              min={-2}
              max={3}
              step={0.1}
            />
            <StableInput
              label="Agree 👍"
              tooltip="Base utility for Agree."
              id="wA"
              value={localConfig.w.agree}
              onChange={(value) => updateLocalNestedConfig('w', 'agree', value)}
              min={-2}
              max={3}
              step={0.1}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StableInput
              label="Not Sure 🤔"
              tooltip="Base utility for Not Sure (can be positive if you want to reward nuance)."
              id="wNS"
              value={localConfig.w.not_sure}
              onChange={(value) => updateLocalNestedConfig('w', 'not_sure', value)}
              min={-2}
              max={3}
              step={0.1}
            />
            <StableInput
              label="Disagree 👎"
              tooltip="Base utility for Disagree."
              id="wD"
              value={localConfig.w.disagree}
              onChange={(value) => updateLocalNestedConfig('w', 'disagree', value)}
              min={-2}
              max={3}
              step={0.1}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <StableInput
              label="Strong Disagree 💔"
              tooltip="Base utility for Strong Disagree. Negative usually."
              id="wSD"
              value={localConfig.w.strong_disagree}
              onChange={(value) => updateLocalNestedConfig('w', 'strong_disagree', value)}
              min={-2}
              max={3}
              step={0.1}
            />
          </div>
        </div>
      </Card>

      {/* User Type Mix */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-accent">🧬 User Type Mix (%)</h3>
          <Button 
            onClick={applyChanges} 
            variant="outline" 
            size="sm"
            data-testid="button-update-usertypes"
          >
            Update Variables
          </Button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StableInput
              label="Normal 🙂"
              tooltip="Baseline balanced actors."
              id="pctNormal"
              value={localConfig.mix.Normal}
              onChange={(value) => updateLocalNestedConfig('mix', 'Normal', Math.round(value))}
              min={0}
              max={100}
              step={1}
            />
            <StableInput
              label="Joker 😆"
              tooltip="Comedy & dunks."
              id="pctJoker"
              value={localConfig.mix.Joker}
              onChange={(value) => updateLocalNestedConfig('mix', 'Joker', Math.round(value))}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StableInput
              label="Troll 😈"
              tooltip="Spicy & bait-prone."
              id="pctTroll"
              value={localConfig.mix.Troll}
              onChange={(value) => updateLocalNestedConfig('mix', 'Troll', Math.round(value))}
              min={0}
              max={100}
              step={1}
            />
            <StableInput
              label="Intellectual 🧐"
              tooltip="Insight & news oriented."
              id="pctIntel"
              value={localConfig.mix.Intellectual}
              onChange={(value) => updateLocalNestedConfig('mix', 'Intellectual', Math.round(value))}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <StableInput
              label="Journalist 📝"
              tooltip="High news propensity, high vibe usage."
              id="pctJourno"
              value={localConfig.mix.Journalist}
              onChange={(value) => updateLocalNestedConfig('mix', 'Journalist', Math.round(value))}
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-accent">🧪 Post Attribute Boosts (−1 to +1)</h3>
          <Button 
            onClick={applyChanges} 
            variant="outline" 
            size="sm"
            data-testid="button-update-boosts"
          >
            Update Variables
          </Button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StableInput
              label="Boost Humor 😹"
              tooltip="Multiply humor by (1 + x). −1..+1. Set negative to de-boost."
              id="boostHumor"
              value={localConfig.boosts.humor}
              onChange={(value) => updateLocalNestedConfig('boosts', 'humor', value)}
              min={-1}
              max={1}
              step={0.05}
            />
            <StableInput
              label="Boost Insight 🧠"
              tooltip="Multiply insight by (1 + x)."
              id="boostInsight"
              value={localConfig.boosts.insight}
              onChange={(value) => updateLocalNestedConfig('boosts', 'insight', value)}
              min={-1}
              max={1}
              step={0.05}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StableInput
              label="Boost Bait 🪤"
              tooltip="Multiply bait by (1 + x). Use negative to de-boost bait."
              id="boostBait"
              value={localConfig.boosts.bait}
              onChange={(value) => updateLocalNestedConfig('boosts', 'bait', value)}
              min={-1}
              max={1}
              step={0.05}
            />
            <StableInput
              label="Boost Controversy 🌶️"
              tooltip="Multiply controversy by (1 + x)."
              id="boostControversy"
              value={localConfig.boosts.controversy}
              onChange={(value) => updateLocalNestedConfig('boosts', 'controversy', value)}
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
    </TooltipProvider>
  );
}
