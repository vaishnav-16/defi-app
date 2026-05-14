import { ethers, network } from "hardhat";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

/**
 * Deploys the full stack in the right order and writes an address book
 * to `deployments/<network>.json` so the frontend can pick it up.
 *
 * Also seeds two test accounts with 1000 mDAI each on local networks to
 * reproduce the demo flow in the original project report.
 */
async function main() {
  const [deployer, ...rest] = await ethers.getSigners();
  console.log(`\nDeploying with ${deployer.address} on ${network.name}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // ---------- 1. mDAI ----------
  const Dai = await ethers.getContractFactory("DaiToken");
  const dai = await Dai.deploy();
  await dai.waitForDeployment();
  const daiAddr = await dai.getAddress();
  console.log(`DaiToken      -> ${daiAddr}`);

  // ---------- 2. DAPP ----------
  const Dapp = await ethers.getContractFactory("DappToken");
  const dapp = await Dapp.deploy();
  await dapp.waitForDeployment();
  const dappAddr = await dapp.getAddress();
  console.log(`DappToken     -> ${dappAddr}`);

  // ---------- 3. TokenFarm ----------
  // 1e15 wei/sec ≈ 0.001 DAPP/sec pool-wide ≈ 86 DAPP/day
  const rewardRate = 10n ** 15n;
  const Farm = await ethers.getContractFactory("TokenFarm");
  const farm = await Farm.deploy(daiAddr, dappAddr, rewardRate);
  await farm.waitForDeployment();
  const farmAddr = await farm.getAddress();
  console.log(`TokenFarm     -> ${farmAddr}`);

  // ---------- 4. LoanBook ----------
  const Book = await ethers.getContractFactory("LoanBook");
  const book = await Book.deploy(daiAddr);
  await book.waitForDeployment();
  const bookAddr = await book.getAddress();
  console.log(`LoanBook      -> ${bookAddr}\n`);

  // ---------- Wiring ----------
  // Grant the farm the right to mint DAPP rewards.
  const tx = await dapp.setMinter(farmAddr);
  await tx.wait();
  console.log(`Granted TokenFarm minter rights on DAPP.\n`);

  // ---------- Local-only seeding ----------
  if (network.name === "localhost" || network.name === "hardhat") {
    const seed = ethers.parseEther("1000");
    for (const signer of rest.slice(0, 2)) {
      await (await dai.transfer(signer.address, seed)).wait();
      console.log(`Seeded ${signer.address} with 1000 mDAI`);
    }
    console.log();
  }

  // ---------- Address book ----------
  const addresses = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    DaiToken: daiAddr,
    DappToken: dappAddr,
    TokenFarm: farmAddr,
    LoanBook: bookAddr,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const outDir = join(__dirname, "..", "deployments");
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, `${network.name}.json`);
  writeFileSync(outFile, JSON.stringify(addresses, null, 2));
  console.log(`Address book written to ${outFile}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
