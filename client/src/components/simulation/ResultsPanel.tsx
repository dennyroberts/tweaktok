import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SimulationState, USER_TYPES } from "@/lib/simulation";
import { ChartManager } from "@/lib/charts";

interface ResultsPanelProps {
  simulationState: SimulationState;
  isRunning: boolean;
}

export default function ResultsPanel({ simulationState, isRunning }: ResultsPanelProps) {
  const chartManagerRef = useRef<ChartManager | null>(null);
  const [selectedAttribute, setSelectedAttribute] = useState('humor');
  const [selectedTypeMix, setSelectedTypeMix] = useState('Normal');
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(USER_TYPES));

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
      // Small delay to ensure DOM elements are ready
      setTimeout(() => {
        chartManagerRef.current?.updateAllCharts(simulationState);
        chartManagerRef.current?.updateAttributesByTypeChart(simulationState, selectedAttribute, visibleTypes);
        chartManagerRef.current?.updateTypeMixChart(simulationState, selectedTypeMix);
      }, 100);
    }
  }, [simulationState, selectedAttribute, selectedTypeMix, visibleTypes]);

  const toggleTypeVisibility = (type: string) => {
    const newVisibleTypes = new Set(visibleTypes);
    if (newVisibleTypes.has(type)) {
      newVisibleTypes.delete(type);
    } else {
      newVisibleTypes.add(type);
    }
    setVisibleTypes(newVisibleTypes);
  };

  const calculateKPIs = () => {
    if (simulationState.rows.length === 0) {
      return {
        totalPosts: 0,
        avgReward: 0,
        avgBaitFlags: 0,
        totalFollowers: 0
      };
    }

    const totalPosts = simulationState.rows.length;
    const avgReward = simulationState.rows.reduce((sum, row) => sum + row.reward, 0) / totalPosts;
    const avgBaitFlags = simulationState.rows.reduce((sum, row) => sum + row.bait_flags, 0) / totalPosts;
    const totalFollowers = simulationState.users.reduce((sum, user) => sum + user.followers, 0);

    return {
      totalPosts,
      avgReward: avgReward.toFixed(2),
      avgBaitFlags: avgBaitFlags.toFixed(2),
      totalFollowers
    };
  };

  const calculateTypeStats = () => {
    const stats: Record<string, any> = {};
    
    for (const type of USER_TYPES) {
      const typeRows = simulationState.rows.filter(row => row.user_type === type);
      const typeUsers = simulationState.users.filter(user => user.type === type);
      
      if (typeRows.length === 0) {
        stats[type] = {
          sa: 0, a: 0, ns: 0, d: 0, sd: 0, bait: 0, comments: 0, reward: 0, followers: 0
        };
        continue;
      }

      const totals = typeRows.reduce((acc, row) => ({
        sa: acc.sa + row.strong_agree,
        a: acc.a + row.agree,
        ns: acc.ns + row.not_sure,
        d: acc.d + row.disagree,
        sd: acc.sd + row.strong_disagree,
        bait: acc.bait + row.bait_flags,
        comments: acc.comments + row.comments,
        reward: acc.reward + row.reward
      }), { sa: 0, a: 0, ns: 0, d: 0, sd: 0, bait: 0, comments: 0, reward: 0 });

      const avgFollowers = typeUsers.reduce((sum, user) => sum + user.followers, 0) / Math.max(1, typeUsers.length);

      stats[type] = {
        sa: (totals.sa / typeRows.length).toFixed(1),
        a: (totals.a / typeRows.length).toFixed(1),
        ns: (totals.ns / typeRows.length).toFixed(1),
        d: (totals.d / typeRows.length).toFixed(1),
        sd: (totals.sd / typeRows.length).toFixed(1),
        bait: (totals.bait / typeRows.length).toFixed(2),
        comments: (totals.comments / typeRows.length).toFixed(1),
        reward: (totals.reward / typeRows.length).toFixed(2),
        followers: Math.round(avgFollowers)
      };
    }
    
    return stats;
  };

  const kpis = calculateKPIs();
  const typeStats = calculateTypeStats();

  return (
    <div className="space-y-6">
      {/* KPI Display */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-accent mb-4">📊 Results</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-muted/20 border border-border rounded-lg p-3">
            <div className="text-lg font-bold text-primary" data-testid="kpi-rounds">
              {simulationState.roundsDone}
            </div>
            <div className="text-xs text-muted-foreground">Rounds</div>
          </div>
          <div className="bg-muted/20 border border-border rounded-lg p-3">
            <div className="text-lg font-bold text-sim-green" data-testid="kpi-posts">
              {kpis.totalPosts}
            </div>
            <div className="text-xs text-muted-foreground">Posts</div>
          </div>
          <div className="bg-muted/20 border border-border rounded-lg p-3">
            <div className="text-lg font-bold text-sim-orange" data-testid="kpi-reward">
              {kpis.avgReward}
            </div>
            <div className="text-xs text-muted-foreground">Avg Reward</div>
          </div>
          <div className="bg-muted/20 border border-border rounded-lg p-3">
            <div className="text-lg font-bold text-sim-red" data-testid="kpi-bait">
              {kpis.avgBaitFlags}
            </div>
            <div className="text-xs text-muted-foreground">Avg Bait Flags</div>
          </div>
          <div className="bg-muted/20 border border-border rounded-lg p-3">
            <div className="text-lg font-bold text-sim-blue" data-testid="kpi-followers">
              {kpis.totalFollowers}
            </div>
            <div className="text-xs text-muted-foreground">Total Followers</div>
          </div>
        </div>
      </Card>

      {/* Main Charts */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Avg Reward</h3>
              <canvas 
                id="chartReward" 
                className="w-full h-40"
                data-testid="chart-reward"
              ></canvas>
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Avg Bait Flags</h3>
              <canvas 
                id="chartBait" 
                className="w-full h-40"
                data-testid="chart-bait"
              ></canvas>
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Agreement Ratios</h3>
              <canvas 
                id="chartAgree" 
                className="w-full h-40"
                data-testid="chart-agree"
              ></canvas>
            </div>
          </div>
        </div>
      </Card>

      {/* Followers Charts */}
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-accent mb-3">👣 Followers Over Time (By Type)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Normal Users</h4>
                <canvas id="chartF_N" className="w-full h-48" data-testid="chart-followers-normal"></canvas>
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Joker Users</h4>
                <canvas id="chartF_J" className="w-full h-48" data-testid="chart-followers-joker"></canvas>
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Troll Users</h4>
                <canvas id="chartF_T" className="w-full h-48" data-testid="chart-followers-troll"></canvas>
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Intellectual Users</h4>
                <canvas id="chartF_I" className="w-full h-48" data-testid="chart-followers-intellectual"></canvas>
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Journalist Users</h4>
                <canvas id="chartF_JO" className="w-full h-48" data-testid="chart-followers-journalist"></canvas>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Attributes Chart */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-accent">🧬 Attributes Over Time (All Users)</h3>
              <canvas 
                id="chartAttrsOverall" 
                className="w-full h-50"
                data-testid="chart-attributes-overall"
              ></canvas>
            </div>
            {simulationState.seriesAttrs.length > 0 && (
              <div className="ml-6 min-w-0 flex-shrink-0 w-64">
                <div className="text-xs font-medium text-muted-foreground mb-3">Attribute Changes</div>
                <div className="space-y-2 text-xs">
                  {['humor', 'insight', 'bait', 'controversy', 'news', 'dunk'].map((attr, index) => {
                    const start = simulationState.seriesAttrs[0]?.[index] || 0;
                    
                    // Calculate average of last 10 values instead of just the last value
                    const last10 = simulationState.seriesAttrs.slice(-10);
                    const current = last10.length > 0 
                      ? last10.reduce((sum, dataPoint) => sum + (dataPoint[index] || 0), 0) / last10.length
                      : 0;
                    
                    const change = current - start;
                    const changePercent = start > 0 ? ((change / start) * 100) : 0;
                    
                    return (
                      <div key={attr} className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground capitalize">{attr}:</span>
                        <div className="text-right">
                          <div className="text-foreground">
                            {start.toFixed(3)} → {current.toFixed(3)}
                          </div>
                          <div className={`text-xs ${change >= 0 ? 'text-sim-green' : 'text-sim-red'}`}>
                            {change >= 0 ? '+' : ''}{change.toFixed(3)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Label htmlFor="attrSelect" className="text-sm">Show by type for attribute:</Label>
            <Select value={selectedAttribute} onValueChange={setSelectedAttribute}>
              <SelectTrigger className="w-40" data-testid="select-attribute">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="humor">humor</SelectItem>
                <SelectItem value="insight">insight</SelectItem>
                <SelectItem value="bait">bait</SelectItem>
                <SelectItem value="controversy">controversy</SelectItem>
                <SelectItem value="news">news</SelectItem>
                <SelectItem value="dunk">dunk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            {USER_TYPES.map(type => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  data-testid={`checkbox-type-${type.toLowerCase()}`}
                  checked={visibleTypes.has(type)}
                  onCheckedChange={() => toggleTypeVisibility(type)}
                />
                <Label 
                  htmlFor={`type-${type}`}
                  className="text-sm bg-muted/50 border border-border rounded-full px-3 py-1 cursor-pointer"
                >
                  {type}
                </Label>
              </div>
            ))}
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <canvas 
                id="chartAttrsByType" 
                className="w-full h-50"
                data-testid="chart-attributes-by-type"
              ></canvas>
            </div>
            {simulationState.seriesAttrsByType && Object.keys(simulationState.seriesAttrsByType).length > 0 && (
              <div className="ml-6 min-w-0 flex-shrink-0 w-64">
                <div className="text-xs font-medium text-muted-foreground mb-3">
                  {selectedAttribute.charAt(0).toUpperCase() + selectedAttribute.slice(1)} by Type
                </div>
                <div className="space-y-2 text-xs">
                  {USER_TYPES.filter(type => visibleTypes.has(type)).map(type => {
                    const typeData = simulationState.seriesAttrsByType[type] || [];
                    if (typeData.length === 0) return null;
                    
                    const attrIndex = ['humor', 'insight', 'bait', 'controversy', 'news', 'dunk'].indexOf(selectedAttribute);
                    const start = typeData[0]?.[attrIndex] || 0;
                    
                    // Calculate average of last 10 values instead of just the last value
                    const last10 = typeData.slice(-10);
                    const current = last10.length > 0 
                      ? last10.reduce((sum, dataPoint) => sum + (dataPoint[attrIndex] || 0), 0) / last10.length
                      : 0;
                    
                    const change = current - start;
                    const changePercent = start > 0 ? ((change / start) * 100) : 0;
                    
                    return (
                      <div key={type} className="py-1">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">{type}:</span>
                          <div className="text-right">
                            <div className="text-foreground">
                              {start.toFixed(3)} → {current.toFixed(3)}
                            </div>
                            <div className={`text-xs ${change >= 0 ? 'text-sim-green' : 'text-sim-red'}`}>
                              {change >= 0 ? '+' : ''}{change.toFixed(3)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Label htmlFor="mixTypeSelect" className="text-sm">Type attribute mix over time (pick one type):</Label>
            <Select value={selectedTypeMix} onValueChange={setSelectedTypeMix}>
              <SelectTrigger className="w-40" data-testid="select-type-mix">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Joker">Joker</SelectItem>
                <SelectItem value="Troll">Troll</SelectItem>
                <SelectItem value="Intellectual">Intellectual</SelectItem>
                <SelectItem value="Journalist">Journalist</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <canvas 
                id="chartTypeMix" 
                className="w-full h-50"
                data-testid="chart-type-mix"
              ></canvas>
            </div>
            {simulationState.seriesAttrsByType[selectedTypeMix]?.length > 0 && (
              <div className="ml-6 min-w-0 flex-shrink-0 w-64">
                <div className="text-xs font-medium text-muted-foreground mb-3">
                  {selectedTypeMix} Attribute Changes
                </div>
                <div className="space-y-2 text-xs">
                  {['humor', 'insight', 'bait', 'controversy', 'news', 'dunk'].map((attr, index) => {
                    const typeData = simulationState.seriesAttrsByType[selectedTypeMix] || [];
                    const start = typeData[0]?.[index] || 0;
                    
                    // Calculate average of last 10 values instead of just the last value
                    const last10 = typeData.slice(-10);
                    const current = last10.length > 0 
                      ? last10.reduce((sum, dataPoint) => sum + (dataPoint[index] || 0), 0) / last10.length
                      : 0;
                    
                    const change = current - start;
                    const changePercent = start > 0 ? ((change / start) * 100) : 0;
                    
                    return (
                      <div key={attr} className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground capitalize">{attr}:</span>
                        <div className="text-right">
                          <div className="text-foreground">
                            {start.toFixed(3)} → {current.toFixed(3)}
                          </div>
                          <div className={`text-xs ${change >= 0 ? 'text-sim-green' : 'text-sim-red'}`}>
                            {change >= 0 ? '+' : ''}{change.toFixed(3)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Vibe Charts */}
      <Card className="p-6">
        <h3 className="text-sm font-medium text-accent mb-4">🏷️ Vibe Usage Over Time</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm text-foreground mb-2">Overall</h4>
            <canvas 
              id="chartVibeOverall" 
              className="w-full h-40"
              data-testid="chart-vibe-overall"
            ></canvas>
          </div>
          <div>
            <h4 className="text-sm text-foreground mb-2">By Type</h4>
            <canvas 
              id="chartVibeByType" 
              className="w-full h-40"
              data-testid="chart-vibe-by-type"
            ></canvas>
          </div>
        </div>
      </Card>

      {/* Type Statistics Table */}
      <Card className="p-6">
        <h3 className="text-sm font-medium text-accent mb-4">Averages by User Type</h3>
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="table-type-stats">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-sm font-semibold text-muted-foreground">Type</th>
                <th className="text-right py-2 px-3 text-sm font-semibold text-muted-foreground">SA</th>
                <th className="text-right py-2 px-3 text-sm font-semibold text-muted-foreground">A</th>
                <th className="text-right py-2 px-3 text-sm font-semibold text-muted-foreground">NS</th>
                <th className="text-right py-2 px-3 text-sm font-semibold text-muted-foreground">D</th>
                <th className="text-right py-2 px-3 text-sm font-semibold text-muted-foreground">SD</th>
                <th className="text-right py-2 px-3 text-sm font-semibold text-muted-foreground">Bait</th>
                <th className="text-right py-2 px-3 text-sm font-semibold text-muted-foreground">Comments</th>
                <th className="text-right py-2 px-3 text-sm font-semibold text-muted-foreground">Reward</th>
                <th className="text-right py-2 px-3 text-sm font-semibold text-muted-foreground">Followers (avg)</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {USER_TYPES.map(type => (
                <tr key={type} className="border-b border-border/50" data-testid={`row-type-${type.toLowerCase()}`}>
                  <td className="py-2 px-3 text-foreground">{type}</td>
                  <td className="py-2 px-3 text-foreground">{typeStats[type]?.sa || '—'}</td>
                  <td className="py-2 px-3 text-foreground">{typeStats[type]?.a || '—'}</td>
                  <td className="py-2 px-3 text-foreground">{typeStats[type]?.ns || '—'}</td>
                  <td className="py-2 px-3 text-foreground">{typeStats[type]?.d || '—'}</td>
                  <td className="py-2 px-3 text-foreground">{typeStats[type]?.sd || '—'}</td>
                  <td className="py-2 px-3 text-foreground">{typeStats[type]?.bait || '—'}</td>
                  <td className="py-2 px-3 text-foreground">{typeStats[type]?.comments || '—'}</td>
                  <td className="py-2 px-3 text-foreground">{typeStats[type]?.reward || '—'}</td>
                  <td className="py-2 px-3 text-foreground">{typeStats[type]?.followers || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Best Post */}
      <Card className="p-6">
        <h3 className="text-sm font-medium text-accent mb-4">🏆 Most Successful Post (this run)</h3>
        <div className="bg-muted/20 border border-dashed border-border rounded-lg p-4" data-testid="best-post">
          {simulationState.best ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Round {simulationState.best.round} • User #{simulationState.best.user_id} ({simulationState.best.user_type})
                </span>
                {simulationState.best.vibe_on && (
                  <Badge variant="outline" className="text-xs bg-primary/20 text-primary">
                    🏷️ Vibe
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Humor</div>
                  <div className="font-medium text-foreground" data-testid="best-post-humor">
                    {simulationState.best.humor.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Insight</div>
                  <div className="font-medium text-foreground" data-testid="best-post-insight">
                    {simulationState.best.insight.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Controversy</div>
                  <div className="font-medium text-foreground" data-testid="best-post-controversy">
                    {simulationState.best.controversy.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Reward</div>
                  <div className="font-medium text-primary" data-testid="best-post-reward">
                    {simulationState.best.reward.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <div className="text-muted-foreground text-sm mb-1">Reactions</div>
                <div className="flex gap-4 text-sm flex-wrap">
                  <span>💚 Strong Agree: <span className="font-medium text-sim-green" data-testid="best-post-sa">{simulationState.best.strong_agree}</span></span>
                  <span>👍 Agree: <span className="font-medium" data-testid="best-post-a">{simulationState.best.agree}</span></span>
                  <span>🤔 Not Sure: <span className="font-medium" data-testid="best-post-ns">{simulationState.best.not_sure}</span></span>
                  <span>👎 Disagree: <span className="font-medium" data-testid="best-post-d">{simulationState.best.disagree}</span></span>
                  <span>💔 Strong Disagree: <span className="font-medium text-sim-red" data-testid="best-post-sd">{simulationState.best.strong_disagree}</span></span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-center py-8">
              Run a simulation to see the best performing post
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
