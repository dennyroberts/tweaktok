# Social Media Simulation Platform

A React-based application that models social media discourse dynamics, user behavior patterns, and platform mechanics. This simulation explores how different user types interact, how content spreads, and how platform policies affect overall discourse quality.

*Note: This README was mostly generated with assistance from AI language models.*

## Overview

This platform simulates a social media environment where users with different personalities create posts, react to content, and evolve their behavior based on engagement feedback. Unlike traditional "likes" systems, it uses nuanced reactions (Strong Agree to Strong Disagree) to encourage more thoughtful discourse.

## Key Features

### User Types
The simulation includes five distinct user archetypes:

- **Normal (🙂)**: Balanced users representing typical social media behavior
- **Joker (😆)**: Comedy-focused users who prioritize humor and entertainment
- **Troll (😈)**: Controversy-seeking users who thrive on bait and divisive content  
- **Intellectual (🧐)**: Insight-driven users focused on thoughtful analysis
- **Journalist (📝)**: News-oriented users with high credibility and responsible posting

### Content Attributes
Posts are characterized by six key dimensions:

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
- **Follower Dynamics**: Growth and loss based on content quality and engagement
- **Learning Algorithm**: Users adapt their posting strategies based on what gets engagement

## Core Assumptions

The simulation is built on several key behavioral assumptions:

### Content Performance
- **Humor and Bait do Well**: Funny content and engagement tactics drive the most reach. This is followed by Controversy, Insight, News and Dunk in that order.
- **Bait, Controversy, and Dunks Get the Most Comments**: People are compelled to comment on things that trigger their tribalism.
- **Bait, Controversy, and Dunks Get the Most Flags**: For the same reason, these posts also get flagged the most
- **Agrees and Comments Translate to Increased Followers**: If a post gets Strong Agrees, Agrees, or Comments, that user's follower amount will go up
- **News and Controversy are Conflated**: People interperet news as controversy: if a post's News score is higher than Controversy, we boost the Controversy score to match it
- **Vibe Effects**: The tone system (vibe flagging) is meant to add context to a post, such as "earnest discussion". This reduces the probability a post will get flagged as bait. It also reduces Humor (earnest discussion isn't funny), Controversy (a hot take becomes just an opinion), increases Insight (because people know you've thought about this), and increases the number of comments you get (because you are encouraging discussion).


### User Behavior  
- **Learning from Success**: Users adapt strategies based on what gets engagement. Negative engagement negatively reinforces (getting "Disagrees" might make you less likely to post that type of content). This is also different on a user-type basis (for example, Trolls like Strong Agrees *and* Strong Disagrees)
- **Type-Specific Preferences**: Each user type has different base posting strengths / strategies, which they slowly revert to over time absent of learning
- **Network Effects**: Follower count provides reach advantages with diminishing returns

### Platform Dynamics
- **Moderation Effectiveness**: Community flagging can reduce reach of low-quality content
- **Policy Impact**: Algorithm changes significantly affect discourse patterns
- **Virality Patterns**: Content spread follows realistic local vs. global audience dynamics

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

### Installation and Setup
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

### Running Your First Simulation
1. **Configure Parameters**: Adjust user type distributions, platform policies, and behavioral settings in the control panel
2. **Start Simulation**: Click "Run Simulation" to begin with your chosen parameters
3. **Monitor Progress**: Watch real-time charts showing engagement patterns, content evolution, and user behavior
4. **Analyze Results**: Review metrics for different user types and content attributes
5. **Iterate**: Extend the simulation or try different configurations to explore various scenarios

## Example Use Cases

### Research Applications
- **Content Moderation Studies**: Test different approaches to community-driven moderation
- **Algorithm Impact**: Examine how platform policies affect discourse quality
- **User Behavior Analysis**: Study learning patterns and strategy adaptation
- **Polarization Research**: Investigate factors that drive consensus vs. disagreement

### Educational Uses
- **Social Media Literacy**: Demonstrate how platform mechanics shape behavior
- **Policy Analysis**: Explore trade-offs between engagement and discourse quality
- **System Thinking**: Understand complex interactions in online communities

### Platform Design
- **Feature Testing**: Model potential impacts of new platform features
- **Policy Optimization**: Find configurations that promote healthy discourse
- **User Experience**: Understand how different user types respond to changes

## Configuration Options

### Basic Parameters
- **User Count**: Number of simulated users (5-5000)
- **Simulation Rounds**: Duration of the simulation
- **Learning Rate**: How quickly users adapt their behavior (0-1)
- **User Type Mix**: Distribution of different personality types

### Platform Policies
- **Content Boosts**: Algorithm preferences for different content types (-1 to +1)
- **Moderation Settings**: Bait detection sensitivity and penalty strength
- **Reaction Weights**: How rewarding different reaction types feel to users
- **Vibe System**: Impact of earnest discussion tags on content reach

### Advanced Settings
- **Network Effects**: Follower influence and homophily strength
- **Virality Modeling**: How content spreads through different audience segments
- **Polarization Dynamics**: How extreme reactions influence subsequent responses

## Understanding Results

### Key Metrics to Watch
- **Average Reward**: Overall user satisfaction with engagement received
- **Bait Flag Rate**: Level of community moderation activity
- **Reaction Patterns**: Distribution of agreement vs. disagreement
- **Follower Growth**: User influence and audience development
- **Content Evolution**: How post attributes change over time
- **Vibe Adoption**: Usage of earnest discussion features

### Interpreting Trends
- **Upward Trends**: Users discovering successful strategies
- **Oscillations**: Competing approaches or policy conflicts  
- **Plateaus**: Equilibrium states or learning saturation
- **Type Divergence**: Different user types finding distinct successful niches

## Technical Details

### Architecture
- **Frontend**: React 18 with TypeScript, Tailwind CSS, and Chart.js
- **Backend**: Node.js with Express for API endpoints
- **Simulation Engine**: Agent-based modeling with stochastic processes
- **Data Visualization**: Real-time charts and metrics dashboard

### Key Components
- **SimulationEngine**: Core logic for user behavior and content generation
- **User Agents**: Individual actors with learning algorithms and strategy adaptation
- **Platform Mechanics**: Content reach, moderation, and viral spread modeling
- **Metrics System**: Real-time calculation and tracking of key performance indicators

## Contributing and Future Development

This simulation framework is designed for researchers, educators, and anyone interested in understanding social media dynamics. Areas for potential enhancement include:

- Additional user types and behavioral models
- More sophisticated AI-driven user agents  
- Integration with real social media data for calibration
- Multi-platform comparison features
- Advanced visualization and analysis tools

## Important Disclaimers

- This simulation is for educational and research purposes
- Results should not be considered predictive of real-world behavior without proper validation
- The model represents simplified versions of complex social dynamics
- Real social media platforms involve many additional factors not captured here

## Support and Documentation

For questions, bug reports, or research collaboration opportunities, please open an issue in the repository or contact the development team.

---

*This project demonstrates the complex interplay between individual behavior, platform design, and emergent social dynamics in digital communities.*