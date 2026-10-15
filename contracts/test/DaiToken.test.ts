import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { DaiToken } from "../typechain-types";

describe("DaiToken faucet", () => {
  const AMOUNT = ethers.parseEther("1000");
  const DAY = 24 * 60 * 60;

  let dai: DaiToken;
  let visitor: Awaited<ReturnType<typeof ethers.getSigners>>[number];

  beforeEach(async () => {
    [, visitor] = await ethers.getSigners();
    dai = await (await ethers.getContractFactory("DaiToken")).deploy();
  });

  it("pays 1,000 mDAI to any wallet and emits FaucetClaimed", async () => {
    await expect(dai.connect(visitor).faucet())
      .to.emit(dai, "FaucetClaimed")
      .withArgs(visitor.address, AMOUNT);
    expect(await dai.balanceOf(visitor.address)).to.equal(AMOUNT);
  });

  it("refuses a second claim inside the cooldown", async () => {
    await dai.connect(visitor).faucet();
    await expect(dai.connect(visitor).faucet()).to.be.revertedWithCustomError(dai, "FaucetCooldown");
  });

  it("allows another claim once the cooldown has passed", async () => {
    await dai.connect(visitor).faucet();
    await time.increase(DAY);
    await dai.connect(visitor).faucet();
    expect(await dai.balanceOf(visitor.address)).to.equal(AMOUNT * 2n);
  });

  it("keeps owner-only mint closed to everyone else", async () => {
    await expect(dai.connect(visitor).mint(visitor.address, AMOUNT)).to.be.revertedWithCustomError(
      dai,
      "OwnableUnauthorizedAccount"
    );
  });
});
