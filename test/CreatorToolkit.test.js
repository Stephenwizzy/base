import { expect } from "chai";
import { network } from "hardhat";

describe("Base Creator Toolkit", function () {
  let ethers;

  before(async function () {
    ({ ethers } = await network.getOrCreate());
  });
  async function deploy(name, ...args) {
    const factory = await ethers.getContractFactory(name);
    return factory.deploy(...args);
  }

  it("stores self-managed profiles and links", async function () {
    const [, user] = await ethers.getSigners();
    const profiles = await deploy("ProfileRegistry");
    const links = await deploy("LinkRegistry");

    await profiles.connect(user).setProfile("ipfs://profile");
    await links.connect(user).setLink("github", "https://github.com/Stephenwizzy");

    expect(await profiles.profileURI(user.address)).to.equal("ipfs://profile");
    expect(await links.getLink(user.address, "github")).to.include("github.com");
  });

  it("records permanent messages, guest entries, and document proofs", async function () {
    const [, user] = await ethers.getSigners();
    const board = await deploy("MessageBoard");
    const guestbook = await deploy("Guestbook");
    const proofs = await deploy("ProofRegistry");
    const hash = ethers.keccak256(ethers.toUtf8Bytes("document"));

    await board.connect(user).post("Hello Base");
    await guestbook.connect(user).sign("First visit");
    await proofs.connect(user).register(hash);

    expect(await board.messageCount()).to.equal(1);
    expect((await board.getMessage(0)).author).to.equal(user.address);
    expect(await guestbook.guestCount()).to.equal(1);
    expect((await proofs.proofs(hash)).submitter).to.equal(user.address);
    await expect(guestbook.connect(user).sign("Again")).to.be.revertedWithCustomError(
      guestbook,
      "AlreadySigned"
    );
  });

  it("accepts tips and only lets the owner withdraw", async function () {
    const [owner, user] = await ethers.getSigners();
    const tipJar = await deploy("TipJar", owner.address);

    await tipJar.connect(user).tip("Great work", { value: ethers.parseEther("1") });
    await expect(
      tipJar.connect(user).withdraw(user.address)
    ).to.be.revertedWithCustomError(tipJar, "NotOwner");
    await expect(() => tipJar.withdraw(owner.address)).to.changeEtherBalance(
      ethers,
      tipJar,
      -ethers.parseEther("1")
    );
  });

  it("enforces one vote per wallet", async function () {
    const [, voter] = await ethers.getSigners();
    const poll = await deploy("SimplePoll", "Pick one", ["A", "B"]);

    await poll.connect(voter).vote(1);
    expect(await poll.voteCount(1)).to.equal(1);
    await expect(poll.connect(voter).vote(0)).to.be.revertedWithCustomError(
      poll,
      "AlreadyVoted"
    );
  });

  it("lets only the owner issue badges and manage the allowlist", async function () {
    const [owner, user] = await ethers.getSigners();
    const badges = await deploy("AchievementBadges", owner.address);
    const allowlist = await deploy("AllowlistRegistry", owner.address);
    const badgeId = ethers.id("EARLY_SUPPORTER");

    await badges.defineBadge(badgeId, "ipfs://badge");
    await badges.award(user.address, badgeId);
    await allowlist.setAllowed(user.address, true);

    expect(await badges.hasBadge(user.address, badgeId)).to.equal(true);
    expect(await allowlist.allowed(user.address)).to.equal(true);
    await expect(
      allowlist.connect(user).setAllowed(owner.address, true)
    ).to.be.revertedWithCustomError(allowlist, "NotOwner");
  });

  it("indexes deployments once", async function () {
    const [owner, user] = await ethers.getSigners();
    const directory = await deploy("DeploymentDirectory", owner.address);
    const name = ethers.encodeBytes32String("ProfileRegistry");

    await directory.register(name, user.address);
    expect(await directory.deployments(name)).to.equal(user.address);
    expect(await directory.count()).to.equal(1);
    await expect(directory.register(name, owner.address)).to.be.revertedWithCustomError(
      directory,
      "AlreadyRegistered"
    );
  });
});
