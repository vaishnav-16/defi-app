import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { DaiToken, LoanBook } from "../typechain-types";

describe("LoanBook", () => {
  const LOAN = ethers.parseEther("100"); // 100 mDAI principal
  const FEE = ethers.parseEther("5"); // 5 mDAI fee
  const COLLATERAL = ethers.parseEther("1"); // 1 ETH collateral
  const DAY = 24 * 60 * 60;

  let dai: DaiToken;
  let book: LoanBook;
  let lender: Awaited<ReturnType<typeof ethers.getSigners>>[number];
  let borrower: Awaited<ReturnType<typeof ethers.getSigners>>[number];
  let outsider: Awaited<ReturnType<typeof ethers.getSigners>>[number];

  beforeEach(async () => {
    [lender, borrower, outsider] = await ethers.getSigners();

    dai = await (await ethers.getContractFactory("DaiToken")).deploy();
    book = await (await ethers.getContractFactory("LoanBook")).deploy(await dai.getAddress());

    // Lender already has mDAI from deployment (deployer). Top up borrower for repayment fee.
    await dai.transfer(borrower.address, ethers.parseEther("200"));
  });

  const offer = async () => {
    await dai.connect(lender).approve(await book.getAddress(), LOAN);
    await book.connect(lender).offerLoan(LOAN, FEE, COLLATERAL, 7 * DAY);
    return 0n; // first loan id
  };

  describe("offerLoan", () => {
    it("escrows the principal and stores the loan", async () => {
      await dai.connect(lender).approve(await book.getAddress(), LOAN);
      await expect(book.connect(lender).offerLoan(LOAN, FEE, COLLATERAL, 7 * DAY))
        .to.emit(book, "LoanOffered")
        .withArgs(0, lender.address, LOAN, FEE, COLLATERAL, 7 * DAY);

      expect(await dai.balanceOf(await book.getAddress())).to.equal(LOAN);

      const loan = await book.loans(0);
      expect(loan.lender).to.equal(lender.address);
      expect(loan.state).to.equal(0); // Offered
    });

    it("rejects zero loan amount", async () => {
      await expect(
        book.connect(lender).offerLoan(0, FEE, COLLATERAL, 7 * DAY)
      ).to.be.revertedWithCustomError(book, "InvalidLoanAmount");
    });

    it("rejects zero collateral", async () => {
      await dai.connect(lender).approve(await book.getAddress(), LOAN);
      await expect(
        book.connect(lender).offerLoan(LOAN, FEE, 0, 7 * DAY)
      ).to.be.revertedWithCustomError(book, "InvalidCollateral");
    });

    it("rejects zero duration", async () => {
      await dai.connect(lender).approve(await book.getAddress(), LOAN);
      await expect(
        book.connect(lender).offerLoan(LOAN, FEE, COLLATERAL, 0)
      ).to.be.revertedWithCustomError(book, "InvalidDuration");
    });
  });

  describe("cancelOffer", () => {
    it("returns the escrowed mDAI to the lender", async () => {
      const id = await offer();
      const before = await dai.balanceOf(lender.address);
      await book.connect(lender).cancelOffer(id);
      expect(await dai.balanceOf(lender.address)).to.equal(before + LOAN);
      const loan = await book.loans(id);
      expect(loan.state).to.equal(4); // Cancelled
    });

    it("only the lender can cancel", async () => {
      const id = await offer();
      await expect(book.connect(outsider).cancelOffer(id)).to.be.revertedWithCustomError(
        book,
        "NotLender"
      );
    });

    it("cannot cancel a taken loan", async () => {
      const id = await offer();
      await book.connect(borrower).takeLoan(id, { value: COLLATERAL });
      await expect(book.connect(lender).cancelOffer(id)).to.be.revertedWithCustomError(
        book,
        "WrongState"
      );
    });
  });

  describe("takeLoan", () => {
    it("transfers principal to borrower and locks collateral", async () => {
      const id = await offer();
      const before = await dai.balanceOf(borrower.address);
      await book.connect(borrower).takeLoan(id, { value: COLLATERAL });

      expect(await dai.balanceOf(borrower.address)).to.equal(before + LOAN);
      expect(await ethers.provider.getBalance(await book.getAddress())).to.equal(COLLATERAL);

      const loan = await book.loans(id);
      expect(loan.borrower).to.equal(borrower.address);
      expect(loan.state).to.equal(1); // Taken
    });

    it("rejects wrong collateral amount", async () => {
      const id = await offer();
      await expect(
        book.connect(borrower).takeLoan(id, { value: COLLATERAL / 2n })
      ).to.be.revertedWithCustomError(book, "WrongCollateralSent");
    });

    it("cannot be taken twice", async () => {
      const id = await offer();
      await book.connect(borrower).takeLoan(id, { value: COLLATERAL });
      await expect(
        book.connect(outsider).takeLoan(id, { value: COLLATERAL })
      ).to.be.revertedWithCustomError(book, "WrongState");
    });
  });

  describe("repay", () => {
    it("pays principal + fee to lender and returns collateral", async () => {
      const id = await offer();
      await book.connect(borrower).takeLoan(id, { value: COLLATERAL });

      await dai.connect(borrower).approve(await book.getAddress(), LOAN + FEE);

      const lenderDaiBefore = await dai.balanceOf(lender.address);
      const borrowerEthBefore = await ethers.provider.getBalance(borrower.address);

      const tx = await book.connect(borrower).repay(id);
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;

      // Lender gets principal back + fee.
      expect(await dai.balanceOf(lender.address)).to.equal(lenderDaiBefore + LOAN + FEE);

      // Borrower gets collateral back (minus gas).
      const borrowerEthAfter = await ethers.provider.getBalance(borrower.address);
      expect(borrowerEthAfter).to.equal(borrowerEthBefore + COLLATERAL - gasCost);

      const loan = await book.loans(id);
      expect(loan.state).to.equal(2); // Repaid
    });

    it("only the borrower can repay", async () => {
      const id = await offer();
      await book.connect(borrower).takeLoan(id, { value: COLLATERAL });
      await expect(book.connect(outsider).repay(id)).to.be.revertedWithCustomError(
        book,
        "NotBorrower"
      );
    });
  });

  describe("liquidate", () => {
    it("transfers collateral to lender after deadline", async () => {
      const id = await offer();
      await book.connect(borrower).takeLoan(id, { value: COLLATERAL });

      await time.increase(8 * DAY); // past the 7-day deadline

      const lenderEthBefore = await ethers.provider.getBalance(lender.address);
      const tx = await book.connect(lender).liquidate(id);
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;

      expect(await ethers.provider.getBalance(lender.address)).to.equal(
        lenderEthBefore + COLLATERAL - gasCost
      );

      const loan = await book.loans(id);
      expect(loan.state).to.equal(3); // Liquidated
    });

    it("cannot liquidate before deadline", async () => {
      const id = await offer();
      await book.connect(borrower).takeLoan(id, { value: COLLATERAL });
      await expect(book.connect(lender).liquidate(id)).to.be.revertedWithCustomError(
        book,
        "DeadlineNotPassed"
      );
    });

    it("only the lender can liquidate", async () => {
      const id = await offer();
      await book.connect(borrower).takeLoan(id, { value: COLLATERAL });
      await time.increase(8 * DAY);
      await expect(book.connect(outsider).liquidate(id)).to.be.revertedWithCustomError(
        book,
        "NotLender"
      );
    });
  });

  describe("isLiquidatable", () => {
    it("returns false for offered loans", async () => {
      const id = await offer();
      expect(await book.isLiquidatable(id)).to.equal(false);
    });

    it("returns true after deadline, false before", async () => {
      const id = await offer();
      await book.connect(borrower).takeLoan(id, { value: COLLATERAL });
      expect(await book.isLiquidatable(id)).to.equal(false);
      await time.increase(8 * DAY);
      expect(await book.isLiquidatable(id)).to.equal(true);
    });
  });
});
