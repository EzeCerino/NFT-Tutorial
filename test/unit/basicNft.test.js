const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("basicNFT unit test", function () {
          let deployer, basicNft, tokenCounter
          beforeEach(async function () {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["all"])
              basicNft = await ethers.getContract("BasicNft")
          })
          describe("constructor", function () {
              it("initialize basicNFT correctly", async function () {
                  const tokenCounter = await basicNft.getTokenCounter()
                  const name = await basicNft.name()
                  const symbol = await basicNft.symbol()
                  assert.equal(tokenCounter.toString(), "0")
                  assert.equal(name, "Doggie")
                  assert.equal(symbol, "DOG")
              })
          })
          describe("Minting", () => {
              beforeEach(async function () {
                  tokenCounter = await basicNft.getTokenCounter()
                  const mintTx = await basicNft.mintNFT()
                  await mintTx.wait(1)
              })
              it("token counter goes up", async () => {
                  const newTokenCounter = await basicNft.getTokenCounter()
                  assert.equal(newTokenCounter.toString(), tokenCounter.add(1).toString())
              })
              it("Updates tokenURI", async () => {
                  const tokenUri = await basicNft.tokenURI(0)
                  assert.equal(tokenUri, await basicNft.TOKEN_URI())
              })
              it("check owner address and balance", async () => {
                  const deployerAddress = deployer.address
                  const deployerBalance = await basicNft.balanceOf(deployerAddress)
                  const owner = await basicNft.ownerOf("0")

                  assert.equal(deployerBalance.toString(), "1")
                  assert.equal(owner, deployerAddress)
              })
          })
      })
