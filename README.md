
# Social Media Simulation Platform

A sophisticated React-based application that models social media discourse dynamics, user behavior patterns, and platform mechanics. This simulation explores how different user types interact, how content spreads, and how platform policies affect overall discourse quality.

## 🎯 Overview

This platform simulates a social media environment where users with different personalities create posts, react to content, and evolve their behavior based on engagement feedback. Unlike traditional "likes" systems, it uses nuanced reactions (Strong Agree to Strong Disagree) to encourage more thoughtful discourse.

## 🚀 Features

### Core Simulation Engine
- **Multi-User Types**: Five distinct user archetypes with unique behavioral patterns
- **Content Attributes**: Six-dimensional content classification system
- **Dynamic Learning**: Users adapt their posting strategies based on engagement feedback
- **Real-time Visualization**: Live charts and metrics tracking simulation progress

### User Types
1. **Normal (🙂)**: Balanced users representing typical social media behavior
2. **Joker (😆)**: Comedy-focused users who prioritize humor and dunking
3. **Troll (😈)**: Controversy-seeking users who thrive on bait and divisive content
4. **Intellectual (🧐)**: Insight-driven users focused on thoughtful analysis
5. **Journalist (📝)**: News-oriented users with high credibility and vibe usage

### Content Attributes
- **Humor**: Entertainment value and comedic content
- **Insight**: Analytical depth and thoughtful perspectives
- **Bait**: Low-quality engagement farming tactics
- **Controversy**: Divisive or inflammatory content
- **News**: Current events and factual information
- **Dunk**: Critical takedowns and roasts

### Platform Mechanics
- **Nuanced Reactions**: Five-point scale from Strong Agree to Strong Disagree
- **Community Moderation**: User-driven bait flagging system
- **Vibe Tags**: "Good faith discussion" labels that protect against bait flags
- **Follower Dynamics**: Growth/loss based on content quality and engagement
- **Virality Modeling**: Realistic content spread patterns

## 🔬 Key Assumptions & Mechanics

### Content Performance
- **Humor + Bait = Engagement**: Funny content and engagement tactics drive the most reach
- **News = Controversy**: News content naturally generates controversial discussions
- **Insight Takes Time**: Thoughtful content gets steady but slower engagement
- **Controversy Polarizes**: Divisive content creates extreme reactions

### User Behavior
- **Learning from Success**: Users adapt strategies based on what gets engagement
- **Type-Specific Preferences**: Each user type has different utility functions for reactions
- **Homophily Effects**: Users preferentially engage with similar-minded content
- **Follower Influence**: Larger audiences provide reach advantages but with diminishing returns

### Platform Dynamics
- **Bait Penalty System**: Community flagging reduces reach of low-quality content
- **Vibe Protection**: Earnest discussion tags provide moderation immunity
- **Algorithmic Boosts**: Platform-level policies can favor/suppress content types
- **Network Effects**: Local vs. global audience exposure patterns

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd social-media-simulation

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5000`

### Basic Usage
1. **Configure Parameters**: Adjust user types, platform policies, and behavioral settings
2. **Run Simulation**: Start with default settings or customize your experiment
3. **Analyze Results**: View real-time charts showing engagement, attributes, and user behavior
4. **Extend Simulation**: Add more rounds to observe long-term dynamics
5. **Export Data**: Download CSV results for further analysis

## 📊 Example Scenarios

### Scenario 1: Comedy-Focused Platform
```javascript
// Boost humor, suppress bait
boosts: {
  humor: 0.5,      // 50% boost to funny content
  bait: -0.3,      // 30% penalty to low-quality content
  // ... other attributes
}

// Higher joker percentage
mix: {
  Normal: 40,
  Joker: 30,       // More comedy-focused users
  Troll: 5,        // Fewer trolls
  // ... other types
}
```
**Expected Result**: More humorous discourse, reduced toxicity, higher overall engagement

### Scenario 2: Educational Platform
```javascript
// Boost insight and news, suppress controversy
boosts: {
  insight: 0.4,    // Favor analytical content
  news: 0.3,       // Promote factual information
  controversy: -0.2, // Reduce inflammatory content
}

// Higher intellectual percentage
mix: {
  Normal: 30,
  Intellectual: 40, // More analytical users
  Journalist: 20,   // More credible sources
}
```
**Expected Result**: Higher quality discourse, more thoughtful engagement, slower but deeper discussions

### Scenario 3: High Toxicity Environment
```javascript
// Weak moderation, boost controversial content
baitRatioThresh: 0.8,    // Hard to flag as bait
baitPenaltyMult: 0.8,    // Weak penalties
boosts: {
  controversy: 0.3,       // Reward divisive content
  bait: 0.2,             // Reward engagement farming
}

mix: {
  Normal: 30,
  Troll: 30,             // High troll percentage
  Joker: 20,
}
```
**Expected Result**: Increased polarization, more extreme reactions, potential quality degradation

## 🎛️ Configuration Options

### Core Parameters
- **User Count**: Number of simulated users (5-5000)
- **Rounds**: Simulation duration
- **Learning Rate**: How quickly users adapt behavior (0-1)
- **Bait Threshold**: Sensitivity of community moderation (0-1)

### Platform Policies
- **Content Boosts**: Algorithm preferences for different content types (-1 to +1)
- **Reaction Weights**: How rewarding different reaction types feel
- **Vibe Effects**: Impact of earnest discussion tags
- **Network Effects**: Follower influence and homophily strength

### Advanced Settings
- **Polarization Coupling**: How extreme reactions breed more extreme reactions
- **Virality Modeling**: Reach dynamics and audience targeting
- **Follower Economics**: Growth/loss rates and thresholds

## 📈 Understanding Results

### Key Metrics
- **Average Reward**: Overall user satisfaction with engagement
- **Bait Flags**: Community moderation activity levels
- **Agreement Ratios**: Consensus vs. disagreement patterns
- **Follower Dynamics**: User growth and influence patterns
- **Attribute Evolution**: How content types change over time
- **Vibe Usage**: Adoption of earnest discussion norms

### Interpreting Charts
- **Trending Up**: Users learning successful strategies
- **Oscillations**: Competing strategies or policy conflicts
- **Plateaus**: Equilibrium states or learning saturation
- **Divergence**: Different user types finding distinct niches

## 🔧 Technical Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Chart.js** for data visualization
- **Shadcn/ui** components

### Backend
- **Node.js** with Express
- **In-memory storage** for simulation state
- **Real-time updates** via polling

### Simulation Engine
- **Agent-based modeling** for user behavior
- **Stochastic processes** for content generation
- **Machine learning concepts** for strategy adaptation
- **Network theory** for viral spread modeling

## 🤝 Contributing

This simulation is designed for researchers, educators, and anyone interested in understanding social media dynamics. Contributions welcome for:

- New user types or behavioral models
- Alternative platform mechanics
- Additional visualization features
- Performance optimizations
- Research case studies

## 📝 Research Applications

This platform can be used to study:
- **Content Moderation**: Effects of different policy approaches
- **Algorithm Design**: How recommendation systems shape discourse
- **User Behavior**: Learning patterns and strategy evolution
- **Platform Economics**: Follower dynamics and influence markets
- **Social Psychology**: Polarization, homophily, and consensus formation

## 🔮 Future Enhancements

- **Multi-Platform Modeling**: Compare different social media architectures
- **Advanced AI Users**: More sophisticated behavioral models
- **Real Data Integration**: Calibration with actual social media metrics
- **Interactive Interventions**: Dynamic policy changes during simulation
- **Collaborative Features**: Multi-user research environments

## 📄 License

[Add your license information here]

## 🙋 Support

For questions, suggestions, or research collaborations, please [open an issue](link-to-issues) or contact the development team.

---

*This simulation is for educational and research purposes. Results should not be considered predictive of real-world social media behavior without proper validation.*
