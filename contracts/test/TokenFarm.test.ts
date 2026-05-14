import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { DaiToken, DappToken, TokenFarm } from "../typechain-types";

describe("TokenFarm", () => {
  const REWARD_RATE = 10n ** 15n; // 0.001 DAPP/sec pool-wide
  const HUNDRED = ethers.parseEther("100");

  let dai: DaiToken;
  let dapp: DappToken;
  let farm: TokenFarm;
  let owner: Awaited<ReturnType<typeof ethers.getSigners>>[number];
  let alice: Awaited<ReturnType<typeof ethers.getSigners>>[number];
  let bob: Awaited<ReturnType<typeof ethers.getSigners>>[number];

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();

    dai = await (await ethers.getContractFactory("DaiToken")).deploy();
    dapp = await (await ethers.getContractFactory("DappToken")).deploy();
    farm = await (
      await ethers.getContractFactory("TokenFarm")
    ).deploy(await dai.getAddress(), await dapp.getAddress(), REWARD_RATE);

    // Let the farm mint DAPP.
    await dapp.setMinter(await farm.getAddress());

    // Seed Alice and Bob with 100 mDAI each.
    await dai.transfer(alice.address, HUNDRED);
    await dai.transfer(bob.address, HUNDRED);
  });

  describe("deployment", () => {
    it("wires the staking and reward tokens", async () => {
      expect(await farm.stakingToken()).to.equal(await dai.getAddress());
      expect(await farm.rewardToken()).to.equal(await dapp.getAddress());
    });

    it("sets the initial reward rate", async () => {
      expect(await farm.rewardRate()).to.equal(REWARD_RATE);
    });

    it("names tokens correctly", async () => {
      expect(await dai.name()).to.equal("Mock DAI Token");
      expect(await dapp.name()).to.equal("DApp Token");
    });
  });

  describe("stake", () => {
    it("pulls tokens from the user and updates balances", async () => {
      await dai.connect(alice).approve(await farm.getAddress(), HUNDRED);
      await farm.connect(alice).stake(HUNDRED);

      expect(await dai.balanceOf(alice.address)).to.equal(0);
      expect(await dai.balanceOf(await farm.getAddress())).to.equal(HUNDRED);
      expect(await farm.stakedBalance(alice.address)).to.equal(HUNDRED);
      expect(await farm.totalStaked()).to.equal(HUNDRED);
    });

    it("emits Staked", async () => {
      await dai.connect(alice).approve(await farm.getAddress(), HUNDRED);
      await expect(farm.connect(alice).stake(HUNDRED))
        .to.emit(farm, "Staked")
        .withArgs(alice.address, HUNDRED);
    });

    it("reverts on zero amount", async () => {
      await expect(farm.connect(alice).stake(0)).to.be.revertedWithCustomError(farm, "ZeroAmount");
    });

    it("reverts when paused", async () => {
      await farm.pause();
      await dai.connect(alice).approve(await farm.getAddress(), HUNDRED);
      await expect(farm.connect(alice).stake(HUNDRED)).to.be.revertedWithCustomError(
        farm,
        "EnforcedPause"
      );
    });
  });

  describe("rewards", () => {
    it("accrues proportionally to staked amount and time", async () => {
      await dai.connect(alice).approve(await farm.getAddress(), HUNDRED);
      await farm.connect(alice).stake(HUNDRED);

      // Fast-forward one hour.
      await time.increase(3600);

      const earned = await farm.earned(alice.address);
      const expected = REWARD_RATE * 3600n; // sole staker gets full pool rate
      // Allow 1-second slop for the block timestamp between txs.
      expect(earned).to.be.closeTo(expected, REWARD_RATE);
    });

    it("splits rewards between two stakers proportionally", async () => {
      // Alice stakes 100, Bob stakes 300 — Bob should earn 3× Alice.
      await dai.transfer(bob.address, ethers.parseEther("200"));
      await dai.connect(alice).approve(await farm.getAddress(), HUNDRED);
      await farm.connect(alice).stake(HUNDRED);
      await dai.connect(bob).approve(await farm.getAddress(), ethers.parseEther("300"));
      await farm.connect(bob).stake(ethers.parseEther("300"));

      await time.increase(3600);

      const aliceEarned = await farm.earned(alice.address);
      const bobEarned = await farm.earned(bob.address);

      // Bob earned approximately 3× Alice.
      const ratio = (bobEarned * 100n) / aliceEarned;
      expect(ratio).to.be.closeTo(300n, 2n);
    });

    it("lets users claim earned rewards", async () => {
      await dai.connect(alice).approve(await farm.getAddress(), HUNDRED);
      await farm.connect(alice).stake(HUNDRED);
      await time.increase(3600);

      await expect(farm.connect(alice).claimReward()).to.emit(farm, "RewardClaimed");

      expect(await dapp.balanceOf(alice.address)).to.be.gt(0);
      expect(await farm.rewards(alice.address)).to.equal(0);
    });

    it("reverts claim with no pending reward", async () => {
      await expect(farm.connect(alice).claimReward()).to.be.revertedWithCustomError(
        farm,
        "NothingToClaim"
      );
    });
  });

  describe("unstake", () => {
    beforeEach(async () => {
      await dai.connect(alice).approve(await farm.getAddress(), HUNDRED);
      await farm.connect(alice).stake(HUNDRED);
    });

    it("returns the requested amount to the user", async () => {
      await farm.connect(alice).unstake(HUNDRED);
      expect(await dai.balanceOf(alice.address)).to.equal(HUNDRED);
      expect(await farm.stakedBalance(alice.address)).to.equal(0);
    });

    it("supports partial unstake", async () => {
      const half = HUNDRED / 2n;
      await farm.connect(alice).unstake(half);
      expect(await farm.stakedBalance(alice.address)).to.equal(half);
    });

    it("reverts when over-withdrawing", async () => {
      await expect(
        farm.connect(alice).unstake(HUNDRED + 1n)
      ).to.be.revertedWithCustomError(farm, "InsufficientStakedBalance");
    });

    it("preserves accrued rewards across unstake", async () => {
      await time.increase(3600);
      const pre = await farm.earned(alice.address);
      await farm.connect(alice).unstake(HUNDRED);
      const post = await farm.earned(alice.address);
      // Accrual adds ~1 block of rewards between the reads, so post >= pre.
      expect(post).to.be.gte(pre);
    });
  });

  describe("exit", () => {
    it("unstakes everything and claims in one transaction", async () => {
      await dai.connect(alice).approve(await farm.getAddress(), HUNDRED);
      await farm.connect(alice).stake(HUNDRED);
      await time.increase(3600);

      await farm.connect(alice).exit();

      expect(await farm.stakedBalance(alice.address)).to.equal(0);
      expect(await dai.balanceOf(alice.address)).to.equal(HUNDRED);
      expect(await dapp.balanceOf(alice.address)).to.be.gt(0);
    });
  });

  describe("admin", () => {
    it("only the owner can change reward rate", async () => {
      await expect(farm.connect(alice).setRewardRate(1n)).to.be.revertedWithCustomError(
        farm,
        "OwnableUnauthorizedAccount"
      );
    });

    it("only the owner can pause", async () => {
      await expect(farm.connect(alice).pause()).to.be.revertedWithCustomError(
        farm,
        "OwnableUnauthorizedAccount"
      );
    });
  });
});
