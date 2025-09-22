import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
  const [text, setText] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  // Helper functions
  const isValidPartial = useCallback((s: string) => {
    // Allow empty, negative sign, digits, and one decimal point
    return /^-?\d*\.?\d*$/.test(s) && (s.match(/\./g) || []).length <= 1;
  }, []);
  
  const parseDecimal = useCallback((s: string) => {
    if (s === '' || s === '-' || s === '.') return NaN;
    return parseFloat(s);
  }, []);
  
  const clamp = useCallback((n: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, n));
  }, []);
  
  const quantize = useCallback((n: number, step: number) => {
    return Math.round(n / step) * step;
  }, []);
  
  const format = useCallback((n: number) => {
    return n.toString();
  }, []);
  
  // Only sync from external value when not focused
  useEffect(() => {
    if (!isFocused && format(value) !== text) {
      setText(format(value));
    }
  }, [value, text, isFocused, format]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (isValidPartial(newValue)) {
      setText(newValue);
    }

  }, [isValidPartial]);

  const handleBeforeInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const data = (e as any).data;
    
    if (!data) return; // Allow deletions, backspace, etc.
    
    // Get what the text would be after this input
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const newText = text.substring(0, start) + data + text.substring(end);
    
    // Block if it would create an invalid partial value
    if (!isValidPartial(newText)) {
      e.preventDefault();
    }
  }, [text, isValidPartial]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow navigation keys
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab', 'Escape'].includes(e.key)) {
      return;
    }
    
    // Allow deletion keys
    if (['Backspace', 'Delete'].includes(e.key)) {
      return;
    }
    
    // Allow copy/paste/cut
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    
    // Handle Enter to commit
    if (e.key === 'Enter') {
      inputRef.current?.blur();
      return;
    }
    
    // Block invalid characters
    if (!/^[\d.-]$/.test(e.key)) {
      e.preventDefault();
      return;
    }
    
    // Additional validation for special characters
    const input = e.target as HTMLInputElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const newText = text.substring(0, start) + e.key + text.substring(end);
    
    if (!isValidPartial(newText)) {
      e.preventDefault();
    }
  }, [text, isValidPartial]);
  
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);
  
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    
    // Parse and commit the value
    const parsed = parseDecimal(text);
    if (!isNaN(parsed)) {
      let committed = clamp(parsed, min, max);
      if (step !== 0.01) { // Only quantize if step is explicitly set to something other than default
        committed = quantize(committed, step);
      }
      const formatted = format(committed);
      setText(formatted);
      onChange(committed);
    } else if (text === '') {
      // If empty, don't commit anything - keep the field empty
      // This prevents auto-restoring the previous value
    } else {
      // Invalid text, restore to current value
      setText(format(value));
    }
  }, [text, parseDecimal, clamp, min, max, quantize, step, format, onChange, value]);

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
        type="text"
        inputMode="decimal"
        pattern="[0-9]*[.,]?[0-9]*"
        value={text}
        onBeforeInput={handleBeforeInput}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
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
  const { toast } = useToast();

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

  // Export configuration as JSON
  const exportConfig = useCallback(() => {
    try {
      const configJson = JSON.stringify(localConfig, null, 2);
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `simulation-config-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Configuration Exported",
        description: "Your simulation configuration has been saved as a JSON file.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export configuration. Please try again.",
        variant: "destructive",
      });
    }
  }, [localConfig, toast]);

  // Import configuration from JSON file
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importConfig = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Basic file validation
    if (file.size > 1024 * 1024) { // 1MB limit
      toast({
        title: "File Too Large",
        description: "Configuration file must be smaller than 1MB.",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid JSON file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const configData = JSON.parse(e.target?.result as string);

        // Basic validation - check if it has expected top-level keys
        const requiredKeys = ['usersN', 'rounds', 'learnRate', 'mix', 'w', 'boosts'];
        const hasRequiredKeys = requiredKeys.every(key => key in configData);

        if (!hasRequiredKeys) {
          toast({
            title: "Invalid Configuration",
            description: "This doesn't appear to be a valid simulation configuration file.",
            variant: "destructive",
          });
          return;
        }

        setLocalConfig(configData);
        setConfig(configData);

        toast({
          title: "Configuration Loaded",
          description: "Your simulation configuration has been successfully imported.",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Unable to parse the configuration file. Please check that it's a valid JSON file.",
          variant: "destructive",
        });
        console.error('Config import error:', error);
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [setConfig, toast]);


  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* App Explanation */}
        <Card className="p-6 bg-muted/50">
          <h2 className="text-lg font-semibold text-accent mb-3">📊 Social Media Simulation</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-4">
            <p>This app simulates social media behavior across different user types (Normal, Joker, Troll, Intellectual, Journalist). Each user creates posts with randomly assigned attributes like humor, insight, controversy, and bait content. Users "learn" from successful posts and adapt their future content strategy.</p>

            <p>To encourage more nuanced discussion, instead of a "Likes" system, we have a system of nuanced reactions that range from Strong Agree to Strong Disagree.</p>

            <p>The simulation also includes community-driven moderation: users can flag posts as "bait" (low-quality engagement farming), and when enough people agree, those posts get reduced reach. There's also a "vibe" system where users can tag posts as earnest discussion, which provides some protection from bait flags and shifts the content toward more thoughtful, less controversial discourse.</p>

            <p className="font-semibold text-foreground">*REMEMBER TO HIT 'UPDATE VARIABLES' WHEN YOU CHANGE A SECTION BEFORE RUNNING THE SIM*</p>
          </div>
        </Card>

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
              tooltip="How many posting rounds to simulate on Run. Use ➕ to extend later. Higher values = longer initial simulation runs. Lower values = shorter runs (extend manually as needed)."
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
              tooltip="Users can flag posts as 'bait' (low-quality engagement farming). If enough people agree a post is bait (ratio crosses this threshold), we reduce that post's engagement reach. Think of it as community-driven content moderation. Higher values = harder to flag posts as bait (less sensitive). Lower values = easier to flag posts as bait (more sensitive)."
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
              tooltip="Base exposure budget per post before attribute/follower effects. Higher values = posts get shown to more people initially. Lower values = posts have limited initial exposure."
              id="reachMin"
              value={localConfig.reachMin}
              onChange={(value) => updateLocalConfig('reachMin', Math.round(value))}
              min={1}
              max={10000}
              step={1}
            />
            <StableInput
              label="Base Reach Max 📡"
              tooltip="Upper bound for base exposure before effects. Higher values = allow posts to reach larger audiences. Lower values = cap maximum post exposure."
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
              tooltip="When users add 'vibe' tags to their posts, this reduces how likely others are to flag it as bait. Think of it as a 'good faith discussion' label that provides some protection from being flagged. Lower values = stronger protection from flagging. Higher values = weaker protection (closer to normal flagging rates)."
              id="vibeFlagMult"
              value={localConfig.vibeFlagMult}
              onChange={(value) => updateLocalConfig('vibeFlagMult', value)}
              min={0.1}
              max={1}
              step={0.05}
            />
            <StableInput
              label="Polarization Coupling ⚖️"
              tooltip="Controls how much extreme reactions (strong agree/disagree) encourage more extreme reactions from others. Higher values = more polarized discussions (extreme reactions breed more extreme reactions). Lower values = weaker polarization coupling (moderate responses stay common)."
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
          <div>
            <h3 className="text-sm font-semibold text-accent">🏷️ Vibe Effects</h3>
            <p className="text-xs text-muted-foreground mt-1">How "vibe" tags affect post content and engagement when users mark posts as earnest discussion.</p>
          </div>
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
              tooltip="When someone tags their post as earnest discussion (vibe), it naturally becomes less funny—you can't be both completely earnest and cracking jokes at the same time. This setting controls how much the humor gets toned down. Higher values = earnest posts become much more serious. Lower values = earnest posts can still be somewhat playful."
              id="vibeHumorPenalty"
              value={localConfig.vibeHumorPenalty}
              onChange={(value) => updateLocalConfig('vibeHumorPenalty', value)}
              min={0}
              max={0.9}
              step={0.05}
            />
            <StableInput
              label="Vibe Controversy Penalty 🧊"
              tooltip="When someone tags their post as earnest discussion (vibe), it naturally becomes less of a hot take or provocative statement—earnest posts tend to be more measured and thoughtful rather than inflammatory. This controls how much the spiciness gets reduced. Higher values = earnest posts become much more civil and measured. Lower values = earnest posts can still be somewhat provocative."
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
              tooltip="When someone takes the time to tag their post as earnest discussion (vibe), they're usually putting more thought into it and sharing deeper insights rather than just posting off-the-cuff reactions. This setting boosts how insightful those tagged posts become. Higher values = earnest posts become much more thoughtful and analytical. Lower values = earnest posts get only a small insight boost."
              id="vibeInsightBoost"
              value={localConfig.vibeInsightBoost}
              onChange={(value) => updateLocalConfig('vibeInsightBoost', value)}
              min={0}
              max={1}
              step={0.05}
            />
            <StableInput
              label="Vibe Comment Boost 💬⬆️"
              tooltip="Posts tagged as earnest discussion (vibe) tend to invite more thoughtful responses and genuine conversation rather than just quick reactions. People are more likely to take time to engage meaningfully with content that's marked as serious discussion. Higher values = earnest posts generate much more discussion. Lower values = earnest posts get only slightly more comments."
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
              tooltip="Starting probability for Normal users to use vibe tags. They'll learn from here. 0.05 = 5% chance initially. Higher values = users start using vibe tags more often. Lower values = users rarely use vibe tags initially (must learn through experience)."
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
          <div>
            <h3 className="text-sm font-semibold text-accent">🌐 Network & Homophily</h3>
            <p className="text-xs text-muted-foreground mt-1">Controls follower counts, how followers affect reach, and whether users see diverse content or stay in echo chambers.</p>
          </div>
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
              tooltip="In real social media, some people start with established audiences while others begin from zero. This sets the average starting follower count across all users. Think of it like whether you're simulating a platform of mostly new users or one where people already have some following. Higher values = users start more established. Lower values = users start as unknowns."
              id="followersMean"
              value={localConfig.followersMean}
              onChange={(value) => updateLocalConfig('followersMean', Math.round(value))}
              min={0}
              max={100000}
              step={10}
            />
            <StableInput
              label="Follower→Reach Factor 📈"
              tooltip="In real social media, having more followers helps your posts reach more people, but with diminishing returns—going from 10 to 100 followers matters more than going from 10,000 to 10,100. This controls how much your follower count affects how many people see each post. Higher values = big accounts dominate (like Twitter/X). Lower values = more democratic platform where good content can go viral regardless of follower count."
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
              tooltip="This simulates how social media algorithms balance showing posts to your existing followers versus pushing them to a broader audience. Think of it like the difference between a post that spreads within your friend group first vs. one that immediately gets shown to strangers. Higher values = posts stay within follower bubbles longer (more personal/local). Lower values = posts break out to global audiences faster."
              id="globalAudienceK"
              value={localConfig.globalAudienceK}
              onChange={(value) => updateLocalConfig('globalAudienceK', Math.round(value))}
              min={10}
              max={100000}
              step={10}
            />
            <StableInput
              label="Homophily Strength 🫧"
              tooltip="This is the classic 'filter bubble' or 'echo chamber' effect. When you react positively to certain types of content, do you get shown more of the same (creating a bubble) or does the algorithm keep showing you diverse viewpoints? Real platforms vary widely on this. Higher values = strong filter bubbles where users mostly see content they already agree with. Lower values = diverse feeds that challenge users with different perspectives."
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
          <div>
            <h3 className="text-sm font-semibold text-accent">🎯 Reaction Weights (base blend)</h3>
            <p className="text-xs text-muted-foreground mt-1">How rewarding different reaction types feel to users—positive values make users seek that reaction type, negative values make them avoid it.</p>
          </div>
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
              tooltip="Think of this as how good it feels when people really love your post and strongly agree with you. In real life, some people chase validation and want lots of strong agreement, while others might find it boring or even suspicious when everyone agrees too strongly. Positive values = users love getting strong agreement and will post more content like that. Negative values = users get uncomfortable with too much agreement and will avoid posting things that get universal praise."
              id="wSA"
              value={localConfig.w.strong_agree}
              onChange={(value) => updateLocalNestedConfig('w', 'strong_agree', value)}
              min={-2}
              max={3}
              step={0.1}
            />
            <StableInput
              label="Agree 👍"
              tooltip="This is the basic 'thumbs up' or like reaction—moderate positive feedback. Most people find agreement somewhat rewarding, but you could model contrarians who actually dislike when people agree with them. Positive values = users enjoy getting agreement and will post more content that gets likes. Negative values = users are turned off by agreement (maybe they prefer to be controversial). Zero = users don't care much about basic agreement."
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
              tooltip="This represents when people respond with uncertainty, confusion, or 'I'm not sure' to your post. Some content creators value making people think deeply (even if they're unsure), while others want clear, decisive reactions. Positive values = users enjoy posting thought-provoking content that makes people uncertain or reflective. Negative values = users prefer posts that get clear, definitive reactions rather than confusion. Zero = users don't care about uncertain responses."
              id="wNS"
              value={localConfig.w.not_sure}
              onChange={(value) => updateLocalNestedConfig('w', 'not_sure', value)}
              min={-2}
              max={3}
              step={0.1}
            />
            <StableInput
              label="Disagree 👎"
              tooltip="The basic 'thumbs down' or disagree reaction. Most people don't like being disagreed with, but some personalities (like trolls or devils advocates) actually enjoy stirring up disagreement and debate. Positive values = users enjoy getting disagreement and will post more controversial content. Negative values = users dislike disagreement and will avoid posting things that get negative reactions. Zero = users are neutral about disagreement."
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
              tooltip="This is when people really hate your post and strongly disagree with you. Most normal users want to avoid this kind of intense negative reaction, but trolls and controversy-seekers might actually be motivated by it. Negative values = users hate getting strong disagreement and will avoid posting content that gets them (normal behavior). Positive values = users are energized by strong negative reactions and will post more inflammatory content to get them (troll behavior)."
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
          <div>
            <h3 className="text-sm font-semibold text-accent">🧬 User Type Mix (%)</h3>
            <p className="text-xs text-muted-foreground mt-1">What percentage of users are each archetype—Normal (balanced), Joker (humor-focused), Troll (controversy-seeking), Intellectual (insight-driven), Journalist (news-oriented).</p>
          </div>
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
              tooltip="Baseline balanced actors. Higher values = more normal users in the simulation. Lower values = fewer normal users (more specialized user types)."
              id="pctNormal"
              value={localConfig.mix.Normal}
              onChange={(value) => updateLocalNestedConfig('mix', 'Normal', Math.round(value))}
              min={0}
              max={100}
              step={1}
            />
            <StableInput
              label="Joker 😆"
              tooltip="Comedy & dunks. Higher values = more jokers in the simulation (more humor-focused content). Lower values = fewer jokers."
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
              tooltip="Spicy & bait-prone. Higher values = more trolls in the simulation (more controversial content). Lower values = fewer trolls."
              id="pctTroll"
              value={localConfig.mix.Troll}
              onChange={(value) => updateLocalNestedConfig('mix', 'Troll', Math.round(value))}
              min={0}
              max={100}
              step={1}
            />
            <StableInput
              label="Intellectual 🧐"
              tooltip="Insight & news oriented. Higher values = more intellectuals in the simulation (more analytical content). Lower values = fewer intellectuals."
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
              tooltip="High news propensity, high vibe usage. Higher values = more journalists in the simulation (more news content). Lower values = fewer journalists."
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
          <div>
            <h3 className="text-sm font-semibold text-accent">🧪 Post Attribute Boosts (−1 to +1)</h3>
            <p className="text-xs text-muted-foreground mt-1">Platform-wide modifiers that reward or punish specific types of content—positive values boost engagement for that content type.</p>
          </div>
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
              tooltip="This controls whether the platform's algorithm favors or punishes funny content. Think of it like platform policy—some platforms want to encourage humor and memes (like TikTok), while others might want to discourage joke posts in favor of serious content. Positive values = the platform rewards humor with more reach (comedy-friendly platform). Negative values = the platform suppresses humor (serious discussion platform). Zero = platform is neutral on humor."
              id="boostHumor"
              value={localConfig.boosts.humor}
              onChange={(value) => updateLocalNestedConfig('boosts', 'humor', value)}
              min={-1}
              max={1}
              step={0.05}
            />
            <StableInput
              label="Boost Insight 🧠"
              tooltip="This controls whether the platform's algorithm favors or punishes thoughtful, analytical content. Different platforms have different goals—some want to promote deep thinking and learning, while others might prioritize simpler, more viral content. Positive values = the platform rewards insightful content with more reach (educational platform). Negative values = the platform suppresses analytical content (entertainment-focused platform). Zero = platform is neutral on insight."
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
              tooltip="This controls whether the platform's algorithm favors or punishes clickbait and low-quality engagement farming. Think of the difference between platforms that thrive on outrage and attention-grabbing content versus those that try to promote quality discourse. Positive values = the platform rewards clickbait with more reach (engagement-at-all-costs platform). Negative values = the platform suppresses low-quality bait content (quality-focused platform). Zero = platform is neutral on bait."
              id="boostBait"
              value={localConfig.boosts.bait}
              onChange={(value) => updateLocalNestedConfig('boosts', 'bait', value)}
              min={-1}
              max={1}
              step={0.05}
            />
            <StableInput
              label="Boost Controversy 🌶️"
              tooltip="This controls whether the platform's algorithm favors or punishes controversial, divisive content. Some platforms thrive on heated debates and arguments because they drive engagement, while others try to promote civil discourse and reduce conflict. Positive values = the platform rewards controversial content with more reach (drama-driven platform). Negative values = the platform suppresses divisive content (harmony-focused platform). Zero = platform is neutral on controversy."
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
      <div className="space-y-4">
        {/* Simulation Controls */}
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

        {/* Configuration Import/Export */}
        <div className="flex flex-wrap gap-3">
          <Button
            data-testid="button-export-config"
            onClick={exportConfig}
            variant="outline"
          >
            📤 Export Config
          </Button>

          <Button
            data-testid="button-import-config"
            onClick={importConfig}
            variant="outline"
          >
            📥 Import Config
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
            data-testid="input-import-config"
          />
        </div>
      </div>
      </div>
    </TooltipProvider>
  );
}