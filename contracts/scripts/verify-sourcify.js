// Verifies the Sepolia deployment on Sourcify (API v2) from Hardhat's build info. No API key needed.
// Usage: node scripts/verify-sourcify.js
const fs = require("fs");
const path = require("path");

const CHAIN = 11155111;
const API = "https://sourcify.dev/server";
const book = require("../deployments/sepolia.json");
const buildDir = path.join(__dirname, "..", "artifacts", "build-info");
// Newest build first: a contract edited after the first compile lives only in the later build.
const builds = fs
  .readdirSync(buildDir)
  .map((f) => path.join(buildDir, f))
  .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
  .map((f) => require(f));
const buildFor = (id) => {
  const [file, contract] = id.split(":");
  return builds.find((b) => b.output?.contracts?.[file]?.[contract]);
};

const targets = {
  DaiToken: "contracts/DaiToken.sol:DaiToken",
  DappToken: "contracts/DappToken.sol:DappToken",
  TokenFarm: "contracts/TokenFarm.sol:TokenFarm",
  LoanBook: "contracts/LoanBook.sol:LoanBook",
};

const headers = { "Content-Type": "application/json", "User-Agent": "defi-app-verify/1.0 (github.com/vaishnav-16/defi-app)" };

(async () => {
  for (const [name, id] of Object.entries(targets)) {
    const address = book[name];
    const build = buildFor(id);
    const res = await fetch(`${API}/v2/verify/${CHAIN}/${address}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ stdJsonInput: build.input, compilerVersion: build.solcLongVersion, contractIdentifier: id }),
    });
    const body = await res.json();
    if (!res.ok) { console.log(name, res.status, JSON.stringify(body).slice(0, 300)); continue; }
    let job;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      job = await (await fetch(`${API}/v2/verify/${body.verificationId}`, { headers })).json();
      if (job.isJobCompleted) break;
    }
    console.log(name, address, job.contract?.match ?? job.contract?.runtimeMatch ?? JSON.stringify(job.error ?? job).slice(0, 300));
  }
})();
