import { ethers } from "hardhat";
import book from "../deployments/sepolia.json";

/** Runs the core flows once against the live Sepolia deployment and prints each tx hash. */
async function main() {
  const [signer] = await ethers.getSigners();
  // Public RPC nodes behind a load balancer can report a stale nonce between txs.
  const me = new ethers.NonceManager(signer);
  const address = await signer.getAddress();
  const dai = await ethers.getContractAt("DaiToken", book.DaiToken, me);
  const dapp = await ethers.getContractAt("DappToken", book.DappToken, me);
  const farm = await ethers.getContractAt("TokenFarm", book.TokenFarm, me);
  const loans = await ethers.getContractAt("LoanBook", book.LoanBook, me);
  const step = async (label: string, p: Promise<any>) => {
    const tx = await p;
    const receipt = await tx.wait();
    console.log(`${label.padEnd(18)} ${tx.hash}`);
    return receipt;
  };
  const ten = ethers.parseEther("10");

  const last = await dai.lastFaucetClaim(address);
  if (last === 0n) await step("faucet", dai.faucet());
  else console.log(`faucet             already claimed at ${last}`);
  await step("approve farm", dai.approve(book.TokenFarm, ten));
  await step("stake 10 mDAI", farm.stake(ten));
  await new Promise((r) => setTimeout(r, 20_000));
  console.log(`earned after ~20s  ${ethers.formatEther(await farm.earned(address))} DAPP`);
  await step("exit (unstake+claim)", farm.exit());
  console.log(`DAPP balance       ${ethers.formatEther(await dapp.balanceOf(address))}`);

  await step("approve loanbook", dai.approve(book.LoanBook, ten));
  const offered = await step("offer loan", loans.offerLoan(ten, ethers.parseEther("1"), ethers.parseEther("0.001"), 3600));
  // Read the id from the LoanOffered event: a lagging RPC node can return a stale nextLoanId.
  const id = offered.logs.map((l: any) => loans.interface.parseLog(l)).find((e: any) => e?.name === "LoanOffered")!.args.loanId;
  await step("cancel offer", loans.cancelOffer(id));
  console.log(`loan ${id} state     ${(await loans.loans(id)).state} (4 = Cancelled)`);
  console.log(`ETH left           ${ethers.formatEther(await ethers.provider.getBalance(address))}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
