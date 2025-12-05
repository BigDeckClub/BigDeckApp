# 🃏 BigDeck AI - Commander Deck Builder

An AI-powered Magic: The Gathering Commander/EDH deck building agent using LangChain and Groq (free, fast LLM API).

## ✨ Features

- **AI-Powered Deck Building**: Leverages advanced LLMs to create optimized Commander decks
- **RAG-Enhanced Intelligence**: Integrates EDHREC, MTGGoldfish, and Untapped.gg for data-driven recommendations
- **Commander Format Expertise**: Built-in knowledge of Commander rules, ban list, and deck building theory
- **EDHREC Synergy Data**: Automatically finds high-synergy cards for any commander
- **Meta Analysis**: Access current meta statistics, win rates, and popular strategies
- **Mana Curve Optimization**: Analyzes and optimizes deck curves for consistency
- **Scryfall Integration**: Access to complete Magic card database via free Scryfall API
- **Interactive CLI**: User-friendly command-line interface with multiple modes
- **Archetype Support**: Understands aggro, control, combo, tribal, superfriends, and more
- **Budget Awareness**: Can build decks within specified budget constraints
- **Multiple LLM Providers**: Default Groq (free), with GPT-4o, Claude 3.5, and Ollama support
- **User Preferences**: Saves deck history, favorite commanders, and play style preferences

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (check with `node --version`)
- **Groq API Key** (free, get it at [console.groq.com](https://console.groq.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/BigDeckClub/BigDeckApp.git
cd BigDeckApp

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### Getting a Free Groq API Key

1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env` file

## 📖 Usage

### Interactive Chat Mode (Default)

Start an interactive conversation with the AI deck builder:

```bash
npm start chat
# or
npm run chat
# or
bigdeck chat
```

**Example interaction:**
```
🃏 BigDeck AI - Commander Deck Builder
Using: Groq (Llama 3 70B)

You: Build me a budget Atraxa superfriends deck under $100

AI: I'd be happy to help you build a budget Atraxa, Praetors' Voice 
superfriends deck! Here's my recommendation...

[Generates 100-card deck list with explanations]
```

### Build a Specific Deck

Build a deck with a specific commander and strategy:

```bash
npm run build -- --commander "Atraxa, Praetors' Voice" --strategy "superfriends"
npm run build -- --commander "Krenko, Mob Boss" --strategy "goblin tribal" --budget 150
```

### Suggest Commanders

Get commander suggestions based on colors and theme:

```bash
bigdeck suggest --colors "WUB" --theme "control"
bigdeck suggest --colors "RG" --theme "aggro"
```

### Analyze a Deck

Analyze an existing deck list:

```bash
bigdeck analyze --file my-deck.txt
```

## ⚙️ Configuration

### Environment Variables

Edit `.env` to configure the application:

```bash
# Required: Choose your LLM provider
LLM_PROVIDER=groq

# Add your API key
GROQ_API_KEY=your-key-here
```

### Supported LLM Providers

| Provider | Speed | Cost | Setup |
|----------|-------|------|-------|
| **Groq** (default) | ⚡ Very Fast (~300 tokens/sec) | 💚 Free | Get key at console.groq.com |
| **OpenAI (GPT-4o)** | 🔵 Fast | 💰 Paid | Requires OpenAI API key, best quality |
| **Anthropic (Claude 3.5)** | 🔵 Fast | 💰 Paid | Requires Anthropic API key, excellent reasoning |
| **Ollama** | 🟢 Medium | 💚 Free | Requires local Ollama installation |

## 🏗️ Architecture

```
BigDeckApp/
├── src/
│   ├── index.js                 # Main CLI entry point
│   ├── agent/
│   │   ├── DeckBuilderAgent.js  # Core AI agent logic
│   │   ├── prompts/
│   │   │   └── systemPrompt.js  # Enhanced Commander expertise prompt
│   │   └── tools/
│   │       ├── searchInventory.js      # Search user inventory
│   │       ├── getCardInfo.js          # Fetch from Scryfall
│   │       ├── validateDeck.js         # Validate legality
│   │       ├── getEDHRECSynergies.js   # EDHREC synergy data (NEW!)
│   │       ├── getMetaAnalysis.js      # Meta statistics (NEW!)
│   │       ├── analyzeManaCurve.js     # Mana curve analysis (NEW!)
│   │       └── index.js                # Tool exports
│   ├── integrations/
│   │   ├── bigDeckApi.js        # BigDeckAppV3 API client
│   │   ├── scryfall.js          # Scryfall API wrapper
│   │   ├── edhrec.js            # EDHREC API integration (NEW!)
│   │   ├── mtggoldfish.js       # MTGGoldfish integration (NEW!)
│   │   ├── untapped.js          # Untapped.gg integration (NEW!)
│   │   ├── llm.js               # Multi-provider LLM factory (NEW!)
│   │   └── config.js            # API configuration
│   ├── knowledge/
│   │   ├── commanderRules.js    # Format rules & ban list
│   │   ├── archetypes.js        # Deck archetypes
│   │   ├── deckStructure.js     # Card ratio guidelines
│   │   └── staples.js           # Format staples by color
│   └── utils/
│       ├── manabase.js          # Mana base calculations
│       ├── curveAnalysis.js     # CMC curve analysis
│       ├── colorIdentity.js     # Color identity validation
│       └── userPreferences.js   # User prefs & history (NEW!)
```

## 🎯 Features Deep Dive

### RAG-Powered Intelligence

The AI now leverages Retrieval Augmented Generation (RAG) to provide data-driven recommendations:

- **EDHREC Integration**: Access to synergy scores and inclusion rates for any commander
  - Automatically suggests high-synergy cards based on thousands of real decks
  - Organizes recommendations by card type (creatures, removal, ramp, etc.)
  - Provides inclusion percentages to understand popularity

- **Meta Analysis**: Real-time competitive landscape insights
  - Top commanders and their win rates from Untapped.gg
  - Popular archetypes and color combinations
  - Meta-defining cards and their impact on win rate
  - Power level distribution across the format

- **Mana Curve Optimization**: Ensures deck consistency
  - Analyzes CMC distribution across the deck
  - Compares to ideal curves for different strategies
  - Provides specific recommendations for improvements

### AI Tools Available

When building decks, the AI can autonomously use these tools:

1. **get_edhrec_synergies** - Fetches commander-specific card recommendations
2. **get_meta_analysis** - Gets current meta statistics and trends
3. **analyze_mana_curve** - Analyzes deck curve and suggests optimizations
4. **get_card_info** - Looks up card details from Scryfall
5. **validate_deck** - Checks format legality and color identity
6. **search_inventory** - Searches user's collection (when available)

### Commander Format Knowledge

The AI agent has deep knowledge of:
- **Format Rules**: 100-card singleton, color identity, commander tax, etc.
- **Current Ban List**: Up-to-date with 2024 ban list
- **Deck Building Theory**: 8x8 theory, mana curve optimization, card ratios
- **Meta Awareness**: Power level assessment (1-10 scale)
- **Archetypes**: Aggro, Control, Combo, Tribal, Superfriends, Aristocrats, Voltron, and more

### Recommended Deck Structure

The agent follows these guidelines:
- **35-38 lands** (adjusted for strategy)
- **10-12 ramp sources** (Sol Ring, signets, ramp spells)
- **10+ card draw sources** (essential for long games)
- **10-12 removal pieces** (single target + board wipes)
- **Strategy-specific slots** (varies by archetype)

### Supported Archetypes

- **Aggro**: Fast, creature-based strategies
- **Control**: Counter spells and removal
- **Combo**: Win through card combinations
- **Midrange**: Value and efficient threats
- **Tribal**: Creature type synergies
- **Superfriends**: Planeswalker-focused
- **Aristocrats**: Sacrifice and death triggers
- **Voltron**: Single creature focus
- **Spellslinger**: Instant/sorcery focused
- **Reanimator**: Graveyard recursion
- **Group Hug**: Political and friendly
- **Stax**: Resource denial

## 🔮 Future Roadmap

- [x] **RAG Integration**: EDHREC, MTGGoldfish, Untapped.gg data sources
- [x] **Advanced AI Tools**: Synergy lookup, meta analysis, curve optimization
- [x] **Multi-LLM Support**: GPT-4o, Claude 3.5 Sonnet, Ollama
- [x] **User Preferences**: Deck history and favorite settings
- [ ] **Web UI**: Browser-based interface
- [ ] **Discord Bot**: Build decks in Discord servers
- [ ] **BigDeckAppV3 Integration**: Build decks from your actual collection
- [ ] **Deck Pricing**: Real-time price data from TCGPlayer/CardKingdom
- [ ] **Deck Optimization**: Suggest upgrades for existing decks
- [ ] **Proxy Generator**: Generate printable proxies
- [ ] **Deck Testing**: Simulate games and goldfish testing
- [ ] **Public API**: RESTful API for external integrations

## 🔗 Related Projects

- **BigDeckAppV3**: Card inventory management system (coming soon)
- **Scryfall**: [scryfall.com](https://scryfall.com) - Magic card database API
- **EDHREC**: [edhrec.com](https://edhrec.com) - Commander deck database and recommendations
- **MTGGoldfish**: [mtggoldfish.com](https://www.mtggoldfish.com) - Meta analysis and pricing
- **Untapped.gg**: [untapped.gg](https://www.untapped.gg) - Competitive deck analytics

## 📝 Example Commands

```bash
# Start interactive chat
npm run chat

# Build a specific deck
npm run build -- --commander "Muldrotha" --strategy "graveyard"

# Budget deck
npm run build -- --commander "Edric" --strategy "flying men" --budget 50

# Suggest commanders for colors
bigdeck suggest --colors "GW" --theme "tokens"

# Analyze a deck file
bigdeck analyze --file decklist.txt

# Get help
bigdeck --help
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Scryfall**: For their excellent free API
- **Groq**: For providing free, fast LLM inference
- **LangChain**: For the agent framework
- **MTG Community**: For format knowledge and resources
