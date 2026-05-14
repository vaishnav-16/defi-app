export const loanBookAbi = [
  // --- reads ---
  {
    type: "function",
    name: "nextLoanId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "loans",
    stateMutability: "view",
    inputs: [{ name: "loanId", type: "uint256" }],
    outputs: [
      { name: "lender", type: "address" },
      { name: "borrower", type: "address" },
      { name: "loanAmount", type: "uint256" },
      { name: "feeAmount", type: "uint256" },
      { name: "collateralAmount", type: "uint256" },
      { name: "duration", type: "uint256" },
      { name: "takenAt", type: "uint256" },
      { name: "state", type: "uint8" },
    ],
  },
  {
    type: "function",
    name: "isLiquidatable",
    stateMutability: "view",
    inputs: [{ name: "loanId", type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
  // --- writes ---
  {
    type: "function",
    name: "offerLoan",
    stateMutability: "nonpayable",
    inputs: [
      { name: "loanAmount", type: "uint256" },
      { name: "feeAmount", type: "uint256" },
      { name: "collateralAmount", type: "uint256" },
      { name: "duration", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "cancelOffer",
    stateMutability: "nonpayable",
    inputs: [{ name: "loanId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "takeLoan",
    stateMutability: "payable",
    inputs: [{ name: "loanId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "repay",
    stateMutability: "nonpayable",
    inputs: [{ name: "loanId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "liquidate",
    stateMutability: "nonpayable",
    inputs: [{ name: "loanId", type: "uint256" }],
    outputs: [],
  },
  // --- events ---
  {
    type: "event",
    name: "LoanOffered",
    inputs: [
      { name: "loanId", type: "uint256", indexed: true },
      { name: "lender", type: "address", indexed: true },
      { name: "loanAmount", type: "uint256", indexed: false },
      { name: "feeAmount", type: "uint256", indexed: false },
      { name: "collateralAmount", type: "uint256", indexed: false },
      { name: "duration", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "LoanTaken",
    inputs: [
      { name: "loanId", type: "uint256", indexed: true },
      { name: "borrower", type: "address", indexed: true },
      { name: "deadline", type: "uint256", indexed: false },
    ],
  },
] as const;

export const LOAN_STATES = [
  "Offered",
  "Taken",
  "Repaid",
  "Liquidated",
  "Cancelled",
] as const;

export type LoanState = (typeof LOAN_STATES)[number];
