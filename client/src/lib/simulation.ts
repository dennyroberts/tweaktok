// ======= Constants & Utils =======
const ATTRS = [
  "humor",
  "insight",
  "bait",
  "controversy",
  "news",
  "dunk",
] as const;
const USER_TYPES = [
  "Normal",
  "Joker",
  "Troll",
  "Intellectual",
  "Journalist",
] as const;

type Attribute = (typeof ATTRS)[number];
type UserType = (typeof USER_TYPES)[number];

export interface SimulationConfig {
  usersN: number;
  rounds: number;
  learnRate: number;
  baitRatioThresh: number;
  baitPenaltyMult: number;
  reachMin: number;
  reachMax: number;
  vibeFlagMult: number;
  polarCoupling: number;
  vibeHumorPenalty: number;
  vibeControversyPenalty: number;
  vibeInsightBoost: number;
  vibeCommentBoost: number;
  vibeReachBoost: number;
  followGainThresh: number;
  followersMean: number;
  followerReachFactor: number;
  globalAudienceK: number;
  homophilyStrength: number;
  viralityThreshold: number;
  localFloor: number;
  followGainRate: number;
  followLossRate: number;
  w: {
    strong_agree: number;
    agree: number;
    not_sure: number;
    disagree: number;
    strong_disagree: number;
  };
  boosts: Record<Attribute, number>;
  mix: Record<UserType, number>;
  baseVibeProb: number; // Base probability for Normal users to start using vibe tags
  maWindow: number;
}

export interface User {
  id: number;
  type: UserType;
  strategy: Record<Attribute, number>;
  vibeStrategy: number; // Learned propensity to use vibe tags (0-1)
  wReact: number;
  learnRate: number;
  followers: number;
}

export interface PostRow {
  round: number;
  user_id: number;
  user_type: UserType;
  vibe_on: boolean;
  followers: number;
  humor: number;
  insight: number;
  bait: number;
  controversy: number;
  news: number;
  dunk: number;
  strong_agree: number;
  agree: number;
  not_sure: number;
  disagree: number;
  strong_disagree: number;
  bait_flags: number;
  comments: number;
  reward: number;
}

export interface SimulationState {
  users: User[];
  rows: PostRow[];
  ref: number;
  roundsDone: number;
  seriesReward: number[];
  seriesBait: number[];
  seriesAttrs: number[][];
  seriesAttrsByType: Record<UserType, number[][]>;
  seriesFollowersByType: Record<UserType, number[]>;
  seriesFollowersAll: number[];
  seriesVibeOverall: number[];
  seriesVibeByType: Record<UserType, number[]>;
  best: PostRow | null;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function randNorm(mu = 0, sigma = 1): number {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return (
    mu + sigma * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  );
}

function choiceWeighted<T>(opts: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < opts.length; i++) {
    if ((r -= weights[i]) <= 0) return opts[i];
  }
  return opts[opts.length - 1];
}

const TYPE_BIAS: Record<UserType, Record<Attribute, number>> = {
  Normal: {
    humor: 0.5,
    insight: 0.5,
    bait: 0.3,
    controversy: 0.3,
    news: 0.5,
    dunk: 0.3,
  },
  Joker: {
    humor: 0.8,
    insight: 0.3,
    bait: 0.3,
    controversy: 0.3,
    news: 0.2,
    dunk: 0.6,
  },
  Troll: {
    humor: 0.3,
    insight: 0.1,
    bait: 0.8,
    controversy: 0.8,
    news: 0.1,
    dunk: 0.6,
  },
  Intellectual: {
    humor: 0.2,
    insight: 0.8,
    bait: 0.1,
    controversy: 0.2,
    news: 0.6,
    dunk: 0.1,
  },
  Journalist: {
    humor: 0.25,
    insight: 0.55,
    bait: 0.1,
    controversy: 0.2,
    news: 0.9,
    dunk: 0.1,
  },
};

const VIBE_PROB: Record<UserType, number> = {
  Normal: 0.25,
  Joker: 0.0,
  Troll: 0.0,
  Intellectual: 0.4,
  Journalist: 0.4,
};

const TYPE_REACT_UTILITY: Record<UserType, Record<string, number>> = {
  Normal: { SA: 1.4, A: 1.1, NS: -0.3, D: -0.5, SD: -1.0 },
  Joker: { SA: 1.2, A: 1.1, NS: -0.2, D: -0.4, SD: -1.0 },
  Intellectual: { SA: 0.9, A: 1.0, NS: 0.6, D: 0.6, SD: -0.7 },
  Journalist: { SA: 0.8, A: 1.0, NS: 0.7, D: 0.7, SD: -0.7 },
  Troll: { SA: 1.1, A: -0.6, NS: -0.8, D: -0.6, SD: 1.2 },
};

export class SimulationEngine {
  private state: SimulationState;
  private lastConfig: SimulationConfig | null = null;

  constructor() {
    this.state = {
      users: [],
      rows: [],
      ref: 100,
      roundsDone: 0,
      seriesReward: [],
      seriesBait: [],
      seriesAttrs: [],
      seriesAttrsByType: {} as Record<UserType, number[][]>,
      seriesFollowersByType: {} as Record<UserType, number[]>,
      seriesFollowersAll: [],
      seriesVibeOverall: [],
      seriesVibeByType: {} as Record<UserType, number[]>,
      best: null,
    };

    // Initialize type-specific series
    for (const t of USER_TYPES) {
      this.state.seriesAttrsByType[t] = [];
      this.state.seriesFollowersByType[t] = [];
      this.state.seriesVibeByType[t] = [];
    }
  }

  private applyBoosts(
    eff: Record<Attribute, number>,
    boosts: Record<Attribute, number>,
  ): Record<Attribute, number> {
    const out = { ...eff };
    for (const k of ATTRS) {
      out[k] = clamp01(out[k] * (1 + (boosts[k] || 0)));
    }
    return out;
  }

  private vibeAdjust(
    eff: Record<Attribute, number>,
    vibe: boolean,
    cfg: SimulationConfig,
  ): Record<Attribute, number> {
    if (!vibe) return eff;
    const out = { ...eff };
    out.humor = clamp01(out.humor * (1 - cfg.vibeHumorPenalty));
    out.controversy = clamp01(
      out.controversy * (1 - cfg.vibeControversyPenalty),
    );
    out.insight = clamp01(out.insight * (1 + cfg.vibeInsightBoost));
    return out;
  }

  private reachFromAttrs(
    eff: Record<Attribute, number>,
    minR: number,
    maxR: number,
    followerFactor: number,
    followers: number,
    vibeOn: boolean,
    vibeReachBoost: number,
  ): number {
    const base = Math.floor(minR + Math.random() * (maxR - minR));

    // Combined positive score with proper weighting: humor & bait strongest, then insight, news, controversy, dunk
    const positive =
      0.8 * eff.humor +      // Strongest - humor drives engagement
      0.8 * eff.bait +       // Strongest - bait tactics work
      0.6 * eff.insight +    // Good but not as viral
      0.5 * eff.news +       // News value helps
      0.4 * eff.controversy + // Controversy drives engagement but less than humor/bait
      0.3 * eff.dunk;        // Weakest - dunking is niche

    // Much stronger multiplier range for bigger differences between good/bad posts
    let reach = base * (0.3 + 2.0 * positive);  // Changed from 0.6 + 1.0 to 0.3 + 2.0 for 5x range

    reach *= 1 + followerFactor * Math.log10(1 + followers);

    if (vibeOn) reach *= 1 + vibeReachBoost;
    return Math.max(5, Math.floor(reach));
  }

  private reactionProbs(eff: Record<Attribute, number>) {
    const pos = 0.45 * eff.insight + 0.35 * eff.humor + 0.35 * eff.dunk;
    const neg = 0.35 * eff.controversy + 0.3 * eff.bait + 0.15 * eff.dunk;
    const amb = 0.3 * eff.controversy + 0.15 * eff.news;

    let p_sa = clamp01(0.03 + 0.55 * pos);
    let p_a = clamp01(
      0.06 + 0.5 * (0.4 * eff.humor + 0.5 * eff.insight + 0.3 * eff.news),
    );
    let p_ns = clamp01(0.02 + 0.35 * amb - 0.05 * eff.insight);
    let p_d = clamp01(
      0.02 + 0.45 * eff.controversy + 0.05 * eff.bait - 0.05 * eff.insight,
    );
    let p_sd = clamp01(0.01 + 0.3 * neg);

    let total = p_sa + p_a + p_ns + p_d + p_sd;
    if (total > 1) {
      p_sa /= total;
      p_a /= total;
      p_ns /= total;
      p_d /= total;
      p_sd /= total;
    }

    return {
      strong_agree: p_sa,
      agree: p_a,
      not_sure: p_ns,
      disagree: p_d,
      strong_disagree: p_sd,
    };
  }

  private applyHomophily(probs: Record<string, number>, h: number) {
    const out = { ...probs };
    out.strong_agree *= 1 + h;
    out.agree *= 1 + 0.6 * h;
    out.disagree *= 1 - 0.7 * h;
    out.strong_disagree *= 1 - h;

    let t =
      out.strong_agree +
      out.agree +
      out.not_sure +
      out.disagree +
      out.strong_disagree;
    if (t > 1) {
      out.strong_agree /= t;
      out.agree /= t;
      out.not_sure /= t;
      out.disagree /= t;
      out.strong_disagree /= t;
    }
    return out;
  }

  private baitFlagProb(
    eff: Record<Attribute, number>,
    vibeOn: boolean,
    flagMult: number,
  ): number {
    let p = 0.1 * eff.bait + 0.08 * eff.controversy + 0.06 * eff.dunk;
    if (vibeOn) p *= flagMult;
    return clamp01(0.01 + p);
  }

  private commentProb(
    eff: Record<Attribute, number>,
    vibeOn: boolean,
    boost: number,
  ): number {
    const hi = 0.4 * eff.controversy + 0.35 * eff.bait + 0.3 * eff.dunk;
    const med = (0.18 * (eff.humor + eff.insight + eff.news)) / 3;
    let p = clamp01(0.03 + hi + med);
    if (vibeOn) p = clamp01(p * (1 + boost));
    return p;
  }

  private sampleReaction(probs: Record<string, number>): string {
    const labels = [
      "strong_agree",
      "agree",
      "not_sure",
      "disagree",
      "strong_disagree",
    ];
    const weights = labels.map((k) => probs[k]);
    const rem = Math.max(0, 1 - weights.reduce((a, b) => a + b, 0));
    labels.push("none");
    weights.push(rem);

    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < labels.length; i++) {
      if ((r -= weights[i]) <= 0) return labels[i];
    }
    return "none";
  }

  private engagementScore(
    counts: Record<string, number>,
    comments: number,
    user: User,
    W: SimulationConfig["w"],
  ): number {
    const U = TYPE_REACT_UTILITY[user.type];
    const wrBase =
      W.strong_agree * counts.strong_agree +
      W.agree * counts.agree +
      W.not_sure * counts.not_sure +
      W.disagree * counts.disagree +
      W.strong_disagree * counts.strong_disagree;
    const wrType =
      U.SA * counts.strong_agree +
      U.A * counts.agree +
      U.NS * counts.not_sure +
      U.D * counts.disagree +
      U.SD * counts.strong_disagree;
    const wr = 0.5 * wrBase + 0.5 * wrType;
    return user.wReact * wr + (1 - user.wReact) * comments;
  }

  private learn(
    user: User,
    attrs: Record<Attribute, number>,
    vibeUsed: boolean,
    reward: number,
    ref: number,
  ): void {
    const lr = user.learnRate;
    const adj = Math.tanh((reward - 0.5 * ref) / (0.75 * ref));

    // Learn attribute strategy
    for (const k of ATTRS) {
      user.strategy[k] = clamp01(
        user.strategy[k] + lr * adj * (attrs[k] - user.strategy[k]),
      );
      user.strategy[k] = clamp01(
        0.97 * user.strategy[k] + 0.03 * TYPE_BIAS[user.type][k],
      );
    }

    // Learn vibe usage strategy
    const vibeTarget = vibeUsed ? 1.0 : 0.0;
    user.vibeStrategy = clamp01(
      user.vibeStrategy + lr * adj * (vibeTarget - user.vibeStrategy),
    );

    // Apply bias toward type-specific vibe probability (Normal users use configurable base)
    const typeBias =
      user.type === "Normal" ? 0.05 : VIBE_PROB[user.type] || 0.5;
    user.vibeStrategy = clamp01(0.95 * user.vibeStrategy + 0.05 * typeBias);
  }

  private followerUpdate(
    user: User,
    counts: Record<string, number>,
    comments: number,
    baitFlags: number,
    cfg: SimulationConfig,
    interactions: number,
    reward: number,
    ref: number,
  ): void {
    const baitRatio = interactions > 0 ? baitFlags / interactions : 0;
    const cleared = reward > cfg.followGainThresh * ref;
    const gain = cleared
      ? cfg.followGainRate *
        (2 * counts.strong_agree + 1 * counts.agree + 0.2 * comments)
      : 0;
    const loss =
      cfg.followLossRate *
      Math.max(0, baitRatio - cfg.baitRatioThresh) *
      10;
    const delta = Math.round(gain - loss);
    user.followers = Math.max(0, user.followers + delta);
  }

  private buildUsers(
    n: number,
    mix: Record<UserType, number>,
    learnRate: number,
    followersMean: number,
    baseVibeProb: number,
  ): User[] {
    const entries = Object.entries(mix) as [UserType, number][];
    const total = entries.reduce((a, [, v]) => a + v, 0) || 1;
    const weights = entries.map(([, v]) => v / total);
    const labels = entries.map(([k]) => k);
    const users: User[] = [];

    for (let i = 0; i < n; i++) {
      const t = choiceWeighted(labels, weights);
      const strat: Record<Attribute, number> = {} as any;
      for (const k of ATTRS) {
        strat[k] = clamp01(TYPE_BIAS[t][k] + randNorm(0, 0.08));
      }
      users.push({
        id: i,
        type: t,
        strategy: strat,
        vibeStrategy: clamp01(
          (t === "Normal" ? baseVibeProb : VIBE_PROB[t] || 0.5) +
            randNorm(0, 0.15),
        ), // Initialize with configurable base + noise
        wReact: clamp01(0.5 + Math.random() * 0.4),
        learnRate,
        followers: Math.max(
          0,
          Math.round(Math.max(0, randNorm(followersMean, followersMean * 0.5))),
        ),
      });
    }
    return users;
  }

  startSimulation(cfg: SimulationConfig): SimulationState {
    this.lastConfig = { ...cfg }; // Store the config for later use
    this.state.users = this.buildUsers(
      cfg.usersN,
      cfg.mix,
      cfg.learnRate,
      cfg.followersMean,
      cfg.baseVibeProb,
    );
    this.state.rows = [];
    this.state.ref = 100;
    this.state.roundsDone = 0;
    this.state.seriesReward = [];
    this.state.seriesBait = [];
    this.state.seriesAttrs = [];
    this.state.seriesAttrsByType = {} as Record<UserType, number[][]>;
    this.state.seriesFollowersByType = {} as Record<UserType, number[]>;
    this.state.seriesFollowersAll = [];
    this.state.seriesVibeOverall = [];
    this.state.seriesVibeByType = {} as Record<UserType, number[]>;
    this.state.best = null;

    for (const t of USER_TYPES) {
      this.state.seriesAttrsByType[t] = [];
      this.state.seriesFollowersByType[t] = [];
      this.state.seriesVibeByType[t] = [];
    }

    this.runRounds(cfg.rounds, cfg);
    return { ...this.state };
  }

  runMoreRounds(n: number): SimulationState {
    if (!this.state.users.length) {
      throw new Error("No simulation running. Start a new simulation first.");
    }

    if (!this.lastConfig) {
      throw new Error("No configuration stored. Cannot extend simulation.");
    }

    this.runRounds(n, this.lastConfig);
    return { ...this.state };
  }

  private runRounds(n: number, cfg: SimulationConfig): void {
    for (let r = 0; r < n; r++) {
      const roundIndex = this.state.roundsDone + r;
      let rewardSum = 0,
        baitSum = 0,
        count = 0;
      const attrSum: Record<Attribute, number> & { n: number } = {
        humor: 0,
        insight: 0,
        bait: 0,
        controversy: 0,
        news: 0,
        dunk: 0,
        n: 0,
      };
      const attrSumByType: Record<
        UserType,
        Record<Attribute, number> & { n: number }
      > = {} as any;

      for (const t of USER_TYPES) {
        attrSumByType[t] = {
          humor: 0,
          insight: 0,
          bait: 0,
          controversy: 0,
          news: 0,
          dunk: 0,
          n: 0,
        };
      }

      let vibeOnCount = 0;
      const vibeOnByType: Record<UserType, number> = {} as any;
      const postsByType: Record<UserType, number> = {} as any;

      USER_TYPES.forEach((t) => {
        vibeOnByType[t] = 0;
        postsByType[t] = 0;
      });

      for (const u of this.state.users) {
        const attrs: Record<Attribute, number> = {} as any;
        for (const k of ATTRS) {
          const base = 0.85 * u.strategy[k] + 0.15 * TYPE_BIAS[u.type][k];
          attrs[k] = clamp01(randNorm(base, 0.12));
        }

        // Use learned vibe strategy, but force Jokers and Trolls to never use vibe
        const vibeOn =
          u.type === "Joker" || u.type === "Troll"
            ? false
            : Math.random() < u.vibeStrategy;
        let eff = { ...attrs };
        eff = this.vibeAdjust(eff, vibeOn, cfg);
        eff = this.applyBoosts(eff, cfg.boosts);

        const reachBudget = this.reachFromAttrs(
          eff,
          cfg.reachMin,
          cfg.reachMax,
          cfg.followerReachFactor,
          u.followers,
          vibeOn,
          cfg.vibeReachBoost,
        );
        let probsBase = this.reactionProbs(eff);
        let baitP = this.baitFlagProb(eff, vibeOn, cfg.vibeFlagMult);
        let commentP = this.commentProb(eff, vibeOn, cfg.vibeCommentBoost);

        const counts = {
          strong_agree: 0,
          agree: 0,
          not_sure: 0,
          disagree: 0,
          strong_disagree: 0,
        };
        let baitFlags = 0,
          comments = 0,
          interactions = 0,
          penalty = false;

        for (let i = 0; i < reachBudget; i++) {
          let localShare = u.followers / (u.followers + cfg.globalAudienceK);
          if (i > cfg.viralityThreshold)
            localShare = Math.max(cfg.localFloor, 0.3 * localShare);
          const isLocal = Math.random() < localShare;
          let probs = isLocal
            ? this.applyHomophily(probsBase, cfg.homophilyStrength)
            : { ...probsBase };

          // polarization coupling
          const seen = Math.max(1, interactions);
          const saRatio = counts.strong_agree / seen;
          const sdRatio = counts.strong_disagree / seen;
          const pc = cfg.polarCoupling;
          probs.strong_disagree = clamp01(probs.strong_disagree + pc * saRatio);
          probs.strong_agree = clamp01(probs.strong_agree + pc * sdRatio);

          let tot =
            probs.strong_agree +
            probs.agree +
            probs.not_sure +
            probs.disagree +
            probs.strong_disagree;
          if (tot > 1) {
            probs.strong_agree /= tot;
            probs.agree /= tot;
            probs.not_sure /= tot;
            probs.disagree /= tot;
            probs.strong_disagree /= tot;
          }

          if (Math.random() < baitP) baitFlags++;
          interactions += 1;
          const reactCount =
            counts.strong_agree +
            counts.agree +
            counts.not_sure +
            counts.disagree +
            counts.strong_disagree +
            comments;
          const baitRatio = baitFlags / Math.max(1, reactCount);

          if (!penalty && baitRatio >= cfg.baitRatioThresh) penalty = true;
          if (penalty) {
            for (const k of [
              "strong_agree",
              "agree",
              "not_sure",
              "disagree",
              "strong_disagree",
            ]) {
              probs[k] *= cfg.baitPenaltyMult;
            }
            commentP *= cfg.baitPenaltyMult;
          }

          const rlab = this.sampleReaction(probs);
          if (rlab !== "none") counts[rlab as keyof typeof counts]++;
          if (Math.random() < commentP) comments++;
        }

        const reward = this.engagementScore(counts, comments, u, cfg.w);
        this.state.ref = 0.98 * this.state.ref + 0.02 * Math.max(1, reward);
        this.learn(u, attrs, vibeOn, reward, this.state.ref);
        this.followerUpdate(
          u,
          counts,
          comments,
          baitFlags,
          cfg,
          interactions,
          reward,
          this.state.ref,
        );

        const row: PostRow = {
          round: roundIndex,
          user_id: u.id,
          user_type: u.type,
          vibe_on: vibeOn,
          followers: u.followers,
          ...attrs,
          strong_agree: counts.strong_agree,
          agree: counts.agree,
          not_sure: counts.not_sure,
          disagree: counts.disagree,
          strong_disagree: counts.strong_disagree,
          bait_flags: baitFlags,
          comments,
          reward,
        };

        this.state.rows.push(row);
        if (!this.state.best || row.reward > this.state.best.reward) {
          this.state.best = row;
        }

        rewardSum += reward;
        baitSum += baitFlags;
        count++;

        for (const k of ATTRS) attrSum[k] += attrs[k];
        attrSum.n++;

        for (const k of ATTRS) attrSumByType[u.type][k] += attrs[k];
        attrSumByType[u.type].n++;

        if (vibeOn) {
          vibeOnCount++;
          vibeOnByType[u.type]++;
        }
        postsByType[u.type]++;
      }

      this.state.seriesReward.push(rewardSum / Math.max(1, count));
      this.state.seriesBait.push(baitSum / Math.max(1, count));
      this.state.seriesAttrs.push(
        ATTRS.map((k) => attrSum[k] / Math.max(1, attrSum.n)),
      );

      let totalFollowers = 0;
      for (const t of USER_TYPES) {
        const list = this.state.users.filter((u) => u.type === t);
        const avgF =
          list.reduce((a, u) => a + u.followers, 0) / Math.max(1, list.length);
        this.state.seriesFollowersByType[t].push(avgF);
        totalFollowers += list.reduce((a, u) => a + u.followers, 0);
      }
      this.state.seriesFollowersAll.push(totalFollowers);

      this.state.seriesVibeOverall.push(
        vibeOnCount / Math.max(1, this.state.users.length),
      );
      for (const t of USER_TYPES) {
        const v = postsByType[t] > 0 ? vibeOnByType[t] / postsByType[t] : 0;
        this.state.seriesVibeByType[t].push(v);
      }

      for (const t of USER_TYPES) {
        const at = attrSumByType[t];
        if (at.n > 0) {
          this.state.seriesAttrsByType[t].push(ATTRS.map((k) => at[k] / at.n));
        } else {
          this.state.seriesAttrsByType[t].push(ATTRS.map((_) => 0));
        }
      }
    }
    this.state.roundsDone += n;
  }

  exportCsv(): void {
    if (this.state.rows.length === 0) {
      alert("No simulation data to export.");
      return;
    }

    const headers = Object.keys(this.state.rows[0]).join(",");
    const csvContent = [
      headers,
      ...this.state.rows.map((row) =>
        Object.values(row)
          .map((v) => (typeof v === "string" ? `"${v}"` : v))
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `simulation_results_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  getState(): SimulationState {
    return { ...this.state };
  }
}

export { ATTRS, USER_TYPES };
export type { Attribute, UserType };