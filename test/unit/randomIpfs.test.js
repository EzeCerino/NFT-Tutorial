//https://youtu.be/gyMwXuJrbJQ?t=79325
const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { tokenURIs } = require("../../deploy/02-deploy-randomIPFS")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random IPFS NFT unit test", function () {
          let tokenURIs = [
              "ipfs://QmXaTF4yQP1X4RKXg2u43yH2XxZmCtjN8Hg9GVs85scwVQ",
              "ipfs://QmZYP1Hjprceyu9Dv8Zv3dEMNS9FqJCdo84zyyp95roioD",
              "ipfs://QmSnBXUuDoFZEDa2tiJdzVCC6yRGP9i5wG8CkKkg5VWdaB",
          ]
          let deployer, randomIpfsNft, tokenCounter, previousTokenCounter, mintFee
          const chainId = network.config.chainId
          beforeEach(async function () {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["all"])
              randomIpfsNft = await ethers.getContract("RandomIpfsNft")
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
          })
          describe("Constructor", function () {
              it("initializr correctly", async function () {
                  //const chainId = network.config.chainId
                  const tokenCounter = await randomIpfsNft.getTokenCounter()
                  const mintFee = await randomIpfsNft.getMintFee()
                  assert.equal(tokenCounter, "0")
                  assert.equal(mintFee, networkConfig[chainId].mintFee)
                  for (index in tokenURIs) {
                      assert.equal(tokenURIs[index], await randomIpfsNft.getDogTokenUris(index))
                  }
              })
          })
          describe("Request NFT", function () {
              it("revert if the amount payed is less than the Mint Fee", async function () {
                  const mintFee = Number(networkConfig[chainId].mintFee)
                  //console.log(mintFee)
                  const amountOfMinting = mintFee - 1000000000000
                  //console.log(amountOfMinting)
                  await expect(
                      randomIpfsNft.requestNFT({ value: amountOfMinting.toString() })
                  ).to.be.revertedWith("RandomIpfsNft__NeedMoreEthForMintingNft")
              })
              it("set requestIdToSender mapping correctly", async function () {
                  const mintFee = Number(networkConfig[chainId].mintFee)
                  const tx = await randomIpfsNft.requestNFT({ value: mintFee.toString() })
                  const txReceipt = await tx.wait(1)
                  const requestId = await txReceipt.events[1].args.requestId.toString()
                  //console.log(requestId)
                  const address = await randomIpfsNft.getRequestIdToSender(requestId)
                  //console.log(address, deployer.address)
                  assert.equal(address, deployer.address)
              })
          })
          describe("fulfillRandomWords", () => {
              beforeEach(async function () {
                  mintFee = Number(networkConfig[chainId].mintFee)
                  previousTokenCounter = await randomIpfsNft.getTokenCounter()
                  //console.log(previousTokenCounter.toString())
              })
              it("NFT MINTED, Token Counter is updated correctly", async function () {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("nftMinted", async () => {
                          console.log("found the event. NFT Minted")
                          try {
                              const newTokenCounter = await randomIpfsNft.getTokenCounter()
                              console.log(`New token Counter ${newTokenCounter}`)
                              assert.equal(
                                  newTokenCounter.toString(),
                                  previousTokenCounter.add(1).toString()
                              )
                              const tokenUri = await randomIpfsNft.tokenURI("0")
                              assert(tokenUri.toString().includes("ipfs://"))
                          } catch (error) {
                              reject(error)
                          }
                          resolve()
                      })

                      let tx, txReceipt, requestId
                      tx = await randomIpfsNft.requestNFT({ value: mintFee.toString() })
                      txReceipt = await tx.wait(1)
                      requestId = await txReceipt.events[1].args.requestId.toString()

                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          requestId,
                          randomIpfsNft.address
                      )
                      previousTokenCounter = await randomIpfsNft.getTokenCounter()
                      tx = await randomIpfsNft.requestNFT({ value: mintFee.toString() })
                      txReceipt = await tx.wait(1)
                      requestId = await txReceipt.events[1].args.requestId.toString()

                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          requestId,
                          randomIpfsNft.address
                      )
                  })
              })
          })
          describe("testing dog breeds", () => {
              it("0-10: Pug", async function () {
                  const expectedbreed = await randomIpfsNft.getBredFromModdedRNG(7)
                  assert.equal(0, expectedbreed)
              })
              it("11-40: Shiba", async function () {
                  const expectedbreed = await randomIpfsNft.getBredFromModdedRNG(27)
                  assert.equal(1, expectedbreed)
              })
              it("41-99: Shiba", async function () {
                  const expectedbreed = await randomIpfsNft.getBredFromModdedRNG(57)
                  assert.equal(2, expectedbreed)
              })
          })
      })
