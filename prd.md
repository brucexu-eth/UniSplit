# **Split** – Product Requirements Document

## 1. Purpose & Overview

Group dinners often end with clumsy bill‑splitting. This product provides a **100 % on‑chain, backend‑less** way to create a shared bill in minutes, let guests pay their share with USDT on a single low‑fee L2 (Base), and give the organiser real‑time visibility into who has paid—even if some guests settle in cash.

---

## 2. Use Cases

| ID       | Scenario                 | Primary Actors          | Flow Highlights                                                                                                          |
| -------- | ------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **UC‑1** | Casual restaurant dinner | Organiser + 2‑10 Guests | All guests pay their own share in USDT; bill auto‑settles when paid‑shares = total‑shares.                               |
| **UC‑2** | Mixed payment methods    | Organiser + Guests      | Some guests pay on‑chain, others settle via cash or bank transfer; organiser clicks **Close Bill** to mark as _Settled_. |
| **UC‑3** | Proxy‑paying for others  | Guest                   | Guest selects 2 + shares (e.g., covers partner or child) in one transaction.                                             |
| **UC‑4** | No‑gas guest (future)    | Guest, Paymaster        | Guest lacks ETH for gas; uses on‑ramp or gas‑sponsored Paymaster (P2).                                                   |
| **UC‑5** | Large group event        | Organiser + 20 + Guests | Stress‑test scalability; progress bar & list must update within 3 s for 100 + events.                                    |
| **UC‑6** | Last‑minute joiner       | Guest                   | Guest pays after most shares are settled; UI must still accept and reflect payment before bill is closed.                |

## 2. Goals & Success Metrics

| Goal                 | KPI / Target                                            |
| -------------------- | ------------------------------------------------------- |
| Lightning‑fast setup | Organiser completes bill creation < 60 s                |
| Seamless payment     | ≥ 80 % of guests complete on‑chain payment within 3 min |
| Minimal gas pain     | Average gas cost ≤ US \$0.01 per payer                  |
| No backend ops       | 0 managed servers; dapp served as static files          |

---

## 3. Non‑Goals

- Full accounting / receipt OCR (v > 1.0)
- Cross‑chain settlement or multi‑token payment
- Native mobile apps (PWA is sufficient for MVP)

---

## 4. User Personas

| Persona                | Needs                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| **Organiser Olivia**   | Wants a quick, transparent way to split the bill and avoid chasing friends for payments.       |
| **Guest Gabe**         | Wants to pay with minimal clicks, even if he lacks gas or USDT initially.                      |
| **Crypto‑novice Nina** | Might prefer paying cash or credit card via on‑ramp; still appreciates real‑time confirmation. |

---

## 5. High‑Level Flows

1. **Create Bill** → shareable link / QR appears
2. **Pay Share** → MetaMask opens → confirm
3. **Track Status** → live progress bar updates for all open sessions
4. **Close Bill** → organiser marks as _Settled_ when satisfied, even if shares ≠ target

---

## 6. Functional Requirements

### 6.1 Bill Creation

- **Input fields**: Total amount, fiat currency (default NZD), number of shares.
- **Conversion**: Real‑time FX lookup (exchangerate.host) → USDT amount.
- **Chain ID**: Fixed to Base mainnet.
- On **Create**, the dapp writes `createBill(id, sharePrice, totalShares)` to the Bill contract.

### 6.2 Payment

- Dapp constructs EIP‑681 URI (`ethereum:USDT@8453/transfer?...`).
- Default **quantity = splited amount**; user can edit before signing.
- After tx confirmation, the contract emits `Paid` event to that bill.

### 6.3 States & Mutations

| State       | Trigger                | Immutable? |
| ----------- | ---------------------- | ---------- |
| **Active**  | `createBill`           | No         |
| **Settled** | `closeBill` by creator | Yes        |
|             |                        |            |

### 6.4 Live Status

- Front‑end subscribes to `Paid` events via WebSocket RPC.
- UI elements: progress bar, list of payers (address → ENS if available), shares paid, timestamp.

### 6.5 Organiser Controls

- **Close bill** button → calls `closeBill()`
- **Cancel bill** button → calls `cancelBill()` (disabled once first on‑chain payment detected)

### 6.6 On‑Ramp (P1)

- Integrate **Coinbase Pay** pop‑up for Base / USDT purchases.
- Optional **Transak** SDK as fallback.

### 6.7 Social Sharing (P2)

- Generate Farcaster Frame with _Pay 1 Share_ and _View Status_ buttons.

---

## 7. Non‑Functional Requirements

| Category         | Requirement                                                                          |
| ---------------- | ------------------------------------------------------------------------------------ |
| **Performance**  | Bill page loads < 2 s on 4G; live updates ≤ 3 s latency.                             |
| **Security**     | Contract audited; only bill creator can alter state post‑creation (except payments). |
| **Availability** | Depend solely on public RPCs with automatic fall‑back list.                          |
| **Privacy**      | No personal data stored; only public wallet addresses appear on‑chain.               |

---

## 9. Front‑End Requirements

- **PWA** built with React + Vite.
- URL pattern: `/#/bill/<id>` – supports reload and share.
- QR generated with `qrcode` npm package.
- ENS reverse lookup via `provider.lookupAddress`.

---

## 10. Integration Points

| Service            | Purpose             | Phase |
| ------------------ | ------------------- | ----- |
| Coinbase Pay       | Credit‑card on‑ramp | P1    |
| Transak            | Alternate on‑ramp   | P1    |
| Farcaster Frames   | Social viral loop   | P2    |
| ERC‑4337 Paymaster | Gas sponsorship     | P2    |

---

## 11. Analytics & Metrics

- Simple page‑view tracker (Plausible) for bill creation count.
- Contract event indexer to count total bills, average shares, avg time‑to‑settle.

---

## 12. Roll‑Out Plan

| Phase        | Milestone                                                                       |
| ------------ | ------------------------------------------------------------------------------- |
| **0.1 MVP**  | Core contract deployed, React SPA served from Vercel; internal dinner dog‑food. |
| **0.2 Beta** | ENS display, NZD → USDT conversion, public test.                                |
| **0.3**      | Coinbase Pay integration, Farcaster Frame.                                      |
| **1.0 GA**   | Audit passed, Paymaster live, marketing launch.                                 |

---

## 13. Risks & Mitigations

| Risk                    | Impact             | Mitigation                                       |
| ----------------------- | ------------------ | ------------------------------------------------ |
| Users lack USDT on Base | Payment friction   | On‑ramp widget, Paymaster, proxy‑pay option      |
| FX API outage           | Wrong share price  | Fallback to cached rate; manual override warning |
| RPC rate limits         | UI fails to update | Use multiple free endpoints with round‑robin     |

---

## 14. Appendices

- A1 – FX API contract (exchangerate.host)
- A2 – EIP‑681 URI format examples
- A3 – Competitive landscape (Splitwise, ETHSplit, etc.)
