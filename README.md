# ⚖️ NexusForce — Trustless Commerce. Automatic Justice.

> A blockchain-powered dispute resolution protocol built on Polygon — smart contract escrow, DAO juror tribunal, and zero middlemen.

---

## 👥 Team O(1)

| Role | Name |
|------|------|
| 👑 Team Leader | **Aditya Kumar** |
| 👩‍💻 Member | Sweety Gupta |
| 👨‍💻 Member | Rudra Pratap |
| 👩‍💻 Member | Akrati Singh |

**Hackathon:** ByteVerse · **Track:** Web3 / DeFi / Decentralized Infrastructure

---

## 📌 Table of Contents

1. [One-Line Pitch](#one-line-pitch)
2. [The Problem](#the-problem)
3. [The Solution](#the-solution)
4. [Live Demo & Screenshots](#live-demo--screenshots)
5. [How It Works — User Flow](#how-it-works--user-flow)
6. [Architecture Overview](#architecture-overview)
7. [Smart Contract Architecture](#smart-contract-architecture)
8. [Tech Stack](#tech-stack)
9. [Project File Structure](#project-file-structure)
10. [Key Features](#key-features)
11. [NXF Token Economy](#nxf-token-economy)
12. [Revenue Model](#revenue-model)
13. [Competitive Differentiation](#competitive-differentiation)
14. [Why Blockchain? Not Just a Database?](#why-blockchain-not-just-a-database)
15. [Setup & Running Locally](#setup--running-locally)
16. [Hackathon Demo Flow](#hackathon-demo-flow)
17. [Roadmap](#roadmap)
18. [Team Roles & Contributions](#team-roles--contributions)

---

## 🎯 One-Line Pitch

> NexusForce is a blockchain-powered platform where any two parties can transact with confidence — payments are locked in a smart contract escrow, conflicts are resolved automatically by on-chain logic, and unresolvable disputes are settled by a staked juror DAO — with no banks, no lawyers, and no middlemen.

---

## 🔥 The Problem

Every day, millions of transactions go wrong:

- A **freelancer** delivers work but the client refuses to pay.
- A **buyer** pays for a product that never arrives.
- Two parties in a **P2P crypto trade** disagree on whether conditions were met.
- A **DAO contributor** claims they completed a bounty but the DAO disputes it.

### Today's solutions are broken:

| Solution | Problems |
|----------|----------|
| **Banks & PayPal** | Freeze accounts, reverse payments arbitrarily, charge high fees, take days |
| **Courts & Lawyers** | Expensive, slow (months to years), geographically limited, inaccessible |
| **Platform Arbitration** (Upwork, Fiverr) | Biased toward repeat customers, opaque decision-making |
| **Trust-based P2P** | Doesn't scale — you can't trust strangers |

> **There is no neutral, fast, cheap, globally accessible system for resolving transaction conflicts. NexusForce is that system.**

---

## 💡 The Solution

NexusForce provides a **3-layer conflict resolution engine** built entirely on blockchain:

```
┌─────────────────────────────────────────────────────────────┐
│                     NEXUSFORCE PROTOCOL                      │
│                                                              │
│  Layer 1          Layer 2              Layer 3               │
│  ─────────        ─────────────        ──────────────────    │
│  Smart Contract   Auto Resolution      DAO Juror Tribunal    │
│  Escrow           (~80% of cases)      (Contested cases)     │
│                                                              │
│  Funds locked     Conditions met?      7 jurors selected     │
│  on-chain         → Auto release       via Chainlink VRF     │
│  instantly        in <2 minutes        → Verdict on-chain    │
└─────────────────────────────────────────────────────────────┘
```

### Layer 1 — Smart Contract Escrow
When two parties agree on a deal, the payment is immediately locked inside a **Solidity smart contract** on Polygon. Neither party can access the funds unilaterally.

- Both parties digitally sign deal terms and milestones on-chain.
- Payment (in USDC stablecoin) is deposited by the buyer into the escrow contract.
- Deadline and milestone conditions are encoded into the contract at creation.
- The contract is **immutable** — no one, not even NexusForce, can alter the terms after signing.

### Layer 2 — Automatic Resolution
The smart contract continuously monitors agreed conditions. If all conditions are met within the deadline, it **automatically releases payment** to the seller. This handles ~80% of transactions with zero human involvement.

Conditions checked automatically:
- ✅ Both parties confirmed milestone completion
- ✅ Deadline has not been exceeded
- ✅ No dispute flag raised

**All pass → payment releases instantly. Any fail → escalates to Layer 3.**

### Layer 3 — DAO Juror Tribunal
If one party raises a dispute, the case escalates to the **NexusForce Juror DAO** — a decentralized court of staked, randomly selected token holders.

1. Disputing party raises a flag on-chain and uploads evidence to **IPFS** (permanent, tamper-proof).
2. The IPFS CID (cryptographic fingerprint) is recorded on-chain — evidence cannot be altered after submission.
3. **Chainlink VRF** randomly selects **7 jurors** from eligible NXF stakers. Provably fair — no manipulation possible.
4. Jurors have **48 hours** to review all evidence and cast a vote: Buyer wins / Seller wins / Split payment.
5. The **majority verdict (4 of 7)** is executed automatically by the smart contract.
6. Majority voters earn NXF rewards. Minority voters lose a portion of their stake (slashing).

---

## 🖥️ Live Demo & Screenshots

### Landing Page
> **"Trustless Commerce. Automatic Justice."** — Smart contract escrow · DAO tribunal · Zero middlemen

**Platform Stats:**
- `$4.2M` Total Escrowed
- `13K` Deals Completed
- `99.2%` Auto-Resolution Rate
- `<2 Min` Avg Release Time

### Dashboard — Mission Control
Personal overview of all deals, disputes, and juror activity:
- Active deals with milestone progress bars
- Escrowed value in USDC
- Juror Score (out of 1000)
- NXF Staked amount

### Create Deal — Multi-Step Wizard
Step-by-step flow: **Parties → Milestones → Payment → Review & Sign**

- Live **Protocol Preview** panel updates in real-time
- Milestone-based payment allocation (e.g. Phase 1: 50%, Phase 2: 50%)
- Settlement asset selection: USDC / USDT / MATIC
- **Sign & Propose Deal** — immutable on-chain

### File Dispute
- Select deal, choose grounds (Work Not Delivered / Quality Below Spec / Missed Deadline / Payment Refused / Other)
- Upload evidence to **IPFS Evidence Vault** (drag & drop — permanent, hashed on-chain)
- Choose requested outcome: Full Refund / Full Payment to Seller / Custom Distribution
- **Initiate Dispute Protocol**

### Juror Panel
- Assigned caseload with countdown timer (48hr window)
- Full evidence viewer (IPFS files rendered in browser)
- Complainant statement and grounds
- Verdict options: **Buyer Wins / Equitable Split / Seller Wins**
- **Verify & Commit Verdict** — on-chain cryptographic signature

### Evidence Vault
Decentralized repository of all dispute artifacts:
- wireframe_comparison.pdf, mobile_screenshots.zip, chat_logs_milestone2.pdf, delivery_proof.mp4
- Each file shows IPFS hash, file size, and current status

### DAO Governance
Active proposals voted on by NXF holders:
- **NXF-012:** Increase minimum juror stake from 100 NXF to 200 NXF (68% support)
- **NXF-009:** Implement super-jury appeal for disputes above $10,000 (**PASSED** — 82% support)
- Delegation system: self-delegate or delegate votes to another address

---

## 🔄 How It Works — User Flow

### For a Buyer

```
1. Connect MetaMask wallet (no sign-up needed)
        ↓
2. Create Deal → Enter counterparty address, describe service,
   set milestones (e.g., 50% design, 50% delivery), set deadline
        ↓
3. Choose payment asset (USDC/USDT/MATIC), lock funds in escrow
        ↓
4. Sign & Propose Deal → counterparty receives invite
        ↓
5a. Work delivered → Confirm milestone → Funds auto-release ✅
5b. Dispute arises → File dispute → Upload evidence to IPFS
        ↓
6. Chainlink VRF selects 7 jurors → 48hr voting window
        ↓
7. Verdict executes automatically → Funds move on-chain
```

### For a Seller

```
1. Connect wallet → Receive deal invite notification
        ↓
2. Review deal terms (milestones, deadlines, payment amount)
        ↓
3. Sign deal on-chain → Work begins
        ↓
4. Complete milestone → Mark as delivered → Submit evidence
        ↓
5a. Buyer confirms → Partial/full payment auto-releases ✅
5b. Dispute raised → Participate in evidence submission
        ↓
6. Juror verdict executes → Payment or refund processed
```

### For a Juror

```
1. Stake NXF tokens (minimum threshold required)
        ↓
2. Chainlink VRF randomly selects you for a dispute case
        ↓
3. Review all IPFS evidence in the Evidence Vault
        ↓
4. Cast vote within 48-hour window
        ↓
5a. Voted with majority → Earn NXF reward ✅
5b. Voted with minority → Stake partially slashed ❌
        ↓
6. Reputation score updated on-chain (immutable)
```

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 14)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │Dashboard │  │  Deals   │  │Disputes  │  │Juror / Governance│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
│       └─────────────┴─────────────┴─────────────────┘           │
│                           │                                       │
│                    RainbowKit + Wagmi v2                          │
│                    (Wallet Connection Layer)                       │
└───────────────────────────┬──────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
┌─────────────────────┐      ┌────────────────────────┐
│  POLYGON BLOCKCHAIN  │      │    IPFS / Web3.Storage  │
│                      │      │                        │
│  NexusEscrow.sol     │      │  Evidence files        │
│  NexusJury.sol       │      │  Content-addressed     │
│  NXFToken.sol        │      │  CID stored on-chain   │
│  NexusReputation.sol │      │  Tamper-proof          │
└──────────┬───────────┘      └────────────────────────┘
           │
           ├──── Chainlink VRF v2 (Juror Selection)
           │
           └──── Firebase (Off-chain metadata / notifications)
```

### Data Flow for a Dispute

```
User raises dispute
      │
      ▼
Evidence uploaded to IPFS
      │
      ├── CID returned
      │
      ▼
raiseDIspute(dealId, ipfsCID) called on NexusEscrow.sol
      │
      ▼
NexusJury.sol requests randomness from Chainlink VRF
      │
      ▼
7 jurors selected from NXF staker pool
      │
      ▼
48hr voting window opens
      │
      ▼
castVote() called by each juror
      │
      ▼
finalizeVerdict() tallies majority
      │
      ├── executeVerdict() called on NexusEscrow.sol
      │
      ├── Funds released / refunded / split
      │
      ├── NXF rewards distributed to majority voters
      │
      └── Reputation scores updated via NexusReputation.sol
```

---

## 📜 Smart Contract Architecture

### `NexusEscrow.sol`
The **core contract**. Handles deal creation, milestone tracking, fund locking, auto-release, and dispute flagging.

```solidity
// Key functions:
createDeal(seller, milestones[], deadline, amount)
// Locks funds, stores immutable terms on-chain

confirmMilestone(dealId, milestoneIndex)
// Buyer confirms delivery of a specific milestone

autoRelease(dealId)
// Called when all milestones confirmed — releases funds to seller

raiseDIspute(dealId, ipfsCID)
// Flags the deal, submits IPFS evidence CID on-chain

executeVerdict(dealId, verdict)
// Called by NexusJury.sol after DAO decision — moves funds
```

**Storage:**
- `mapping(uint => Deal) public deals` — all deal states
- `mapping(uint => Milestone[]) public milestones` — per-deal milestone tracking
- `mapping(uint => Dispute) public disputes` — dispute details including IPFS CID

---

### `NexusJury.sol`
Manages **juror selection, voting, verdict execution, and stake slashing**.

```solidity
// Key functions:
selectJurors(disputeId)
// Calls Chainlink VRF, assigns 7 randomly selected jurors

castVote(disputeId, vote)
// Juror submits vote — only callable during active voting window

finalizeVerdict(disputeId)
// Tallies votes, triggers escrow execution
// Distributes rewards to majority, slashes minority
```

**Chainlink VRF Integration:**
```solidity
function requestRandomWords() internal returns (uint256 requestId) {
    return COORDINATOR.requestRandomWords(
        keyHash, subscriptionId, requestConfirmations,
        callbackGasLimit, numWords
    );
}
// Callback populates juror selection from staker pool
```

---

### `NXFToken.sol`
**ERC-20 governance and incentive token** with staking extensions.

```solidity
// Key functions:
stake(amount)       // Locks NXF, makes user juror-eligible
unstake(amount)     // Withdraws after cooldown period
slash(jurorAddress, amount)   // Called by jury contract on minority voters
reward(jurorAddress, amount)  // Distributes earnings to majority voters
```

**Token Properties:**
- Standard: ERC-20
- Network: Polygon PoS
- Symbol: NXF
- Use cases: Staking (juror eligibility), Governance voting, Rewards

---

### `NexusReputation.sol`
Stores and updates **juror reputation scores on-chain** — immutable, public, ungameable.

```solidity
// Key functions:
updateScore(jurorAddress, wasCorrect)
// Increments score for majority vote, decrements for minority

getScore(jurorAddress)
// Returns current reputation score (0–1000 scale)

isEligible(jurorAddress)
// Returns true if juror is above minimum reputation threshold
```

**Reputation Rules:**
- Score range: 0–1000
- Increases with every majority vote
- Decreases with every minority vote or missed vote window
- Jurors below minimum threshold are auto-disqualified
- High-reputation jurors weighted more in VRF selection

---

## 🛠️ Tech Stack

| Layer | Component | Technology |
|-------|-----------|------------|
| **Frontend** | Web application | Next.js 14 (App Router) |
| **Styling** | UI framework | Tailwind CSS |
| **Animation** | UI motion | Framer Motion |
| **Wallet** | Connection & signing | RainbowKit + Wagmi v2 |
| **Blockchain interaction** | Contract calls | ethers.js |
| **Blockchain** | Network | Polygon PoS (low fees, EVM compatible) |
| **Smart Contracts** | Escrow, voting, token, reputation | Solidity 0.8.x |
| **Randomness** | Juror selection | Chainlink VRF v2 |
| **Decentralized Storage** | Evidence files | IPFS via Web3.storage |
| **Off-chain Data** | Metadata, notifications | Firebase |
| **Token Standard** | NXF governance token | ERC-20 |
| **Testing** | Contract unit tests | Hardhat + Chai + Ethers |
| **Deployment** | Contract deployment | Hardhat → Polygon Mumbai → Polygon Mainnet |
| **Language** | Frontend | TypeScript |
| **EIP Support** | Typed signing | EIP-712 (eip712.ts) |

---

## 📁 Project File Structure

```
NexusForce/
├── contracts/
│   └── NexusForceEscrow.sol          # Core escrow smart contract
│
├── src/
│   ├── app/                          # Next.js 14 App Router pages
│   │   ├── layout.tsx                # Root layout (providers, topbar)
│   │   ├── page.tsx                  # Landing page
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Mission Control dashboard
│   │   ├── deals/
│   │   │   └── new/
│   │   │       └── page.tsx          # Create Deal wizard
│   │   ├── disputes/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx          # Individual dispute view
│   │   │   └── new/
│   │   │       └── page.tsx          # File Dispute form
│   │   ├── governance/
│   │   │   └── page.tsx              # DAO Governance / proposals
│   │   ├── juror/
│   │   │   └── page.tsx              # Juror Panel
│   │   └── vault/
│   │       └── page.tsx              # Evidence Vault
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx   # Sidebar + main content wrapper
│   │   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   │   └── TopBar.tsx            # Header with wallet connect
│   │   └── ui/
│   │       ├── CountdownTimer.tsx    # 48hr juror voting timer
│   │       ├── MilestoneProgressBar.tsx  # Visual milestone tracker
│   │       ├── SkeletonLoader.tsx    # Loading states
│   │       ├── StatCard.tsx          # Dashboard metric cards
│   │       ├── StatusBadge.tsx       # Deal/dispute status pills
│   │       ├── TransactionHash.tsx   # Clickable on-chain tx links
│   │       └── ForceGraph.tsx        # Network visualization
│   │
│   ├── hooks/
│   │   ├── index.ts                  # Hook exports
│   │   └── useContractActions.ts     # Contract interaction hooks
│   │
│   ├── lib/
│   │   ├── contract.ts               # Contract ABIs and addresses
│   │   ├── eip712.ts                 # EIP-712 typed data signing
│   │   ├── firebase.ts               # Firebase config
│   │   ├── firebaseService.ts        # Firestore CRUD helpers
│   │   ├── seedData.ts               # Dev/demo seed data
│   │   ├── types.ts                  # TypeScript type definitions
│   │   └── wagmi.ts                  # Wagmi chain/client config
│   │
│   └── providers/
│       ├── WalletProvider.tsx        # RainbowKit + Wagmi provider
│       └── Web3Provider.tsx          # Global Web3 context
│
├── .gitignore
├── favicon.ico                       # NexusForce brand icon
├── globals.css                       # Global Tailwind styles
├── next.config.mjs                   # Next.js config
├── next-env.d.ts                     # TypeScript Next.js types
├── package.json                      # Dependencies
├── postcss.config.mjs                # PostCSS config
├── tailwind.config.ts                # Tailwind theme config
└── tsconfig.json                     # TypeScript config
```

---

## ✨ Key Features

### 1. Escrow Smart Contract
- Funds locked on-chain the moment a deal is signed by both parties
- **Milestone-based partial release** (e.g., 30% on design, 70% on delivery)
- **Time-locked auto-refund** — if neither party acts by deadline, funds revert
- **Multi-signature mutual cancel** — both parties sign to cancel without penalty

### 2. On-Chain Deal Terms
- All conditions, milestones, deadlines, and payment amounts stored immutably on Polygon
- Verifiable by anyone at any time — full transparency
- Signed using Ethereum wallet private key — cryptographic proof of agreement (EIP-712)

### 3. IPFS Evidence Vault
- All dispute evidence uploaded to IPFS via Web3.storage
- **Content-addressed**: CID fingerprint changes if even one byte is altered — tamper-proof
- CID stored on-chain immediately upon submission — timestamped and permanent
- Supports all file types: images, PDFs, videos, code files, ZIP archives
- Evidence vault browsable in the UI with full file preview

### 4. Chainlink VRF Juror Selection
- Uses Chainlink's Verifiable Random Function for cryptographic randomness
- No human or algorithm can predict or manipulate who gets selected
- Jurors drawn from active NXF stakers above minimum stake threshold
- Selection weighted by reputation score — high-reputation jurors more likely picked

### 5. Tiered Appeal System
| Tier | Type | Jurors | Time | Trigger |
|------|------|--------|------|---------|
| 1 | Auto-resolution | 0 | Instant | All conditions met |
| 2 | DAO Tribunal | 7 | 48 hours | Dispute raised |
| 3 | Super-jury | 25 | 72 hours | Dispute > $10,000 USDC |

Each escalation requires an additional bond — discouraging frivolous appeals.

### 6. Wallet-Native UX
- Connect via MetaMask, Coinbase Wallet, or any WalletConnect-compatible wallet
- **No sign-up, no username, no password** — your wallet is your identity
- All actions (sign deal, raise dispute, vote, withdraw) are on-chain transactions
- Mobile-friendly: supports WalletConnect v2

### 7. Real-Time Dispute Dashboard
- Live view of active disputes, current layer, time remaining, and juror vote counts (anonymous until verdict)
- Transaction history with full on-chain audit trail
- Evidence viewer — all IPFS files rendered directly in browser
- Juror earnings tracker: stake, rewards, reputation score, cases handled

### 8. Multi-Asset Payment Support
- **Primary:** USDC and USDT (stablecoins — no price volatility risk)
- **Secondary:** MATIC (Polygon native token)
- **Future:** Any ERC-20 token via configurable escrow contract
- Gas fees in MATIC — fractions of a cent on Polygon — globally accessible including India

### 9. DAO Governance
- NXF holders vote on protocol parameters
- Proposals include fee adjustments, stake thresholds, contract upgrades
- Delegation system — delegate your voting power to another trusted address
- Voting power = NXF staked (not just held)

---

## 💰 NXF Token Economy

```
                    ┌─────────────────┐
                    │   NXF TOKEN     │
                    │   (ERC-20)      │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
     ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
     │   STAKING   │  │  GOVERNANCE │  │   REWARDS    │
     │             │  │             │  │              │
     │ Stake NXF   │  │ Vote on     │  │ Earn NXF     │
     │ → Juror     │  │ protocol    │  │ for honest   │
     │   eligible  │  │ proposals   │  │ verdicts     │
     └─────────────┘  └─────────────┘  └──────────────┘
            │                                 ▲
            └────── Slashing ────────────────►│
                   (minority voters          (majority voters
                    lose NXF)                 gain NXF)
```

**Economic Incentive Design:**
- Jurors must have "skin in the game" — staked NXF is at risk
- Honest voting (majority) → earn NXF from dispute fee pool
- Dishonest/lazy voting (minority or no-show) → stake slashed
- Protocol fee (1.5% of each deal) → funds the NXF reward pool
- This mechanism ensures **rational actors always vote honestly**

---

## 💵 Revenue Model

| Source | Description | Rate |
|--------|-------------|------|
| Transaction fee | % of every deal value processed | 1.5% |
| Dispute fee | Flat fee per dispute raised | $5 USDC |
| Appeal bond | Deposit to escalate to super-jury | $20 USDC |
| Token supply | Initial NXF sale / liquidity provision | One-time |

All collected fees → NXF reward pool + protocol treasury → governed by NXF holders.

---

## 🥊 Competitive Differentiation

| Feature | NexusForce | Kleros | Upwork/Fiverr | Traditional Court |
|---------|------------|--------|---------------|-------------------|
| Trustless escrow | ✅ | ❌ | ❌ | ❌ |
| Auto-resolution | ✅ | ❌ | ❌ | ❌ |
| On-chain evidence | ✅ | Partial | ❌ | ❌ |
| Provably random jurors | ✅ (Chainlink VRF) | ❌ | ❌ | ❌ |
| Juror reputation on-chain | ✅ | ❌ | ❌ | ❌ |
| Global instant verdict | ✅ | ✅ | ❌ | ❌ |
| Stablecoin payments | ✅ | ❌ | Partial | ❌ |
| No account needed | ✅ | ❌ | ❌ | ❌ |
| India-accessible (low fees) | ✅ | Partial | ✅ | ❌ |
| Milestone-based release | ✅ | ❌ | Partial | ❌ |
| Tiered appeal system | ✅ | ❌ | ❌ | ✅ |

---

## 🔗 Why Blockchain? Not Just a Database?

A regular database (MySQL, Firebase) could store deals and disputes — but:

| Concern | Database | NexusForce (Blockchain) |
|---------|----------|------------------------|
| **Trust** | You trust NexusForce the company not to tamper | Smart contract code is public — no trust needed |
| **Self-execution** | Needs a server to send money — can be hacked or shut down | Contract executes itself when conditions are met |
| **Proof of agreement** | Anyone can edit a DB row | Wallet signature is cryptographic — mathematically unforgeable |
| **Censorship** | Company can be sued, seized, or shut down | Polygon runs as long as Ethereum ecosystem lives |
| **Neutrality** | Company can take sides | Code has no preferences — it follows the rules exactly |

> **Every component of NexusForce uses blockchain because it provides something a central server genuinely cannot.**

---

## 🚀 Setup & Running Locally

### Prerequisites
- Node.js 18+
- MetaMask or WalletConnect-compatible wallet
- MATIC on Polygon Mumbai testnet (for gas)

### 1. Clone the Repository
```bash
git clone https://github.com/AdityaKumar1511/NexusForce.git
cd NexusForce
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_JURY_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_NXF_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_REPUTATION_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=80001
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
WEB3_STORAGE_TOKEN=your_web3_storage_token
CHAINLINK_SUBSCRIPTION_ID=your_vrf_subscription_id
```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. Deploy Smart Contracts (optional)
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network mumbai
```

---

## 🎬 Hackathon Demo Flow

> Total demo time: **4–5 minutes**. Every step is a real on-chain transaction — not a mock.

```
Step 1: Open NexusForce → Connect MetaMask wallet
        ↓
Step 2: Create new deal
        → Job description: "Build a React dashboard"
        → Payment: $2,400 USDC
        → Milestone 1: Wireframes (50%) | Milestone 2: Delivery (50%)
        → Deadline: 7 days
        ↓
Step 3: Show escrow contract transaction on Polygon Mumbai Explorer
        → Funds locked ✅
        ↓
Step 4: Mark Milestone 1 complete
        → Show partial auto-release of 50% funds
        ↓
Step 5: Raise dispute on Milestone 2
        → Upload wireframe_comparison.pdf to IPFS
        → Show CID stored on-chain
        ↓
Step 6: Show Chainlink VRF transaction
        → 7 jurors randomly selected from staker pool
        ↓
Step 7: Juror casts vote → Verdict executes
        → Funds move automatically (Buyer Wins / Split / Seller Wins)
        ↓
Step 8: Show reputation score updated on-chain for juror
```

---

## 🗺️ Roadmap

### ✅ Hackathon MVP (Completed)
- [x] Smart contract escrow with milestone support
- [x] IPFS evidence vault
- [x] Chainlink VRF juror selection
- [x] 7-juror DAO tribunal with voting
- [x] On-chain reputation system
- [x] NXF ERC-20 token with staking/slashing
- [x] Full frontend (Next.js 14 + Tailwind)
- [x] Dashboard, Deals, Disputes, Juror Panel, Evidence Vault, Governance
- [x] Wallet-native UX (RainbowKit + Wagmi)

### 🔜 Post-Hackathon (V2)
- [ ] Mobile app (React Native + WalletConnect v2)
- [ ] On-chain messaging between deal parties
- [ ] Push notifications (email + in-app)
- [ ] Deal templates (freelance, bounty, P2P trade)
- [ ] Public reputation profiles per wallet
- [ ] Gasless transactions (ERC-4337 account abstraction)
- [ ] Multi-chain support (Arbitrum, Base)
- [ ] NXF token public sale / DEX listing
- [ ] Super-jury (25-juror) full implementation
- [ ] SDK for third-party integration

### 🔮 V3 Vision
- [ ] B2B API — embed NexusForce escrow in any platform
- [ ] AI-assisted evidence summarization for jurors
- [ ] Cross-chain escrow (bridged assets)
- [ ] Regulatory compliance layer (KYC-optional mode)

---

## 👨‍💻 Team Roles & Contributions

| Member | Role | Contributions |
|--------|------|---------------|
| **Aditya Kumar** | Team Lead & Full-Stack | Smart contract architecture, frontend development, system design, blockchain integration |
| **Rudra Pratap** | Smart Contract Developer | Solidity contracts, Hardhat testing, Chainlink VRF integration, contract deployment |
| **Sweety Gupta** | Web3 & Backend | IPFS integration, Wagmi hooks, Firebase services, wallet connection layer |
| **Akrati Singh** | Frontend Developer | UI components, dashboard pages, deal creation wizard, responsive design |
---

## 📄 License

This project was built for the **ByteVerse Hackathon** by **Team O(1)**.

---

## 🙏 Acknowledgements

- [Polygon](https://polygon.technology/) — for EVM-compatible Layer 2 with near-zero fees
- [Chainlink VRF](https://docs.chain.link/vrf) — for provably fair randomness
- [IPFS / Web3.storage](https://web3.storage/) — for decentralized, permanent evidence storage
- [RainbowKit](https://www.rainbowkit.com/) — for beautiful wallet connection UI
- [Wagmi](https://wagmi.sh/) — for React hooks for Ethereum
- [OpenZeppelin](https://openzeppelin.com/) — for secure ERC-20 contract standards

---

<div align="center">

**Built with ❤️ by Team O(1) at ByteVerse Hackathon**

*Trustless Commerce. Automatic Justice.*

`Next.js` · `Solidity` · `Polygon` · `Chainlink VRF` · `IPFS` · `RainbowKit` · `Wagmi` · `ERC-20`

</div>