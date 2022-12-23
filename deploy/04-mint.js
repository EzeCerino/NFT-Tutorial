const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async function ({ getNamedAccounts }) {
    const { deployer } = await getNamedAccounts()

    // basic NFT
    const basicNft = await ethers.getContract("BasicNft", deployer)
    const basicNftTx = await basicNft.mintNFT()
    await basicNftTx.wait(1)
    console.log(`Basic Nft index 0 has token URI ${await basicNft.tokenURI(0)}`)

    /// Random IPFS NFT
    const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
    const mintfee = await randomIpfsNft.getMintFee()
    await new Promise(async (resolve, reject) => {
        setTimeout(resolve, 900000)
        randomIpfsNft.once("nftMinted", async () => {
            resolve()
        })
        console.log("mint request")
        const randomIpfsNftTx = await randomIpfsNft.requestNFT({ value: mintfee.toString() })
        console.log("waiting blocks...")
        const randomIpfsNftTxRct = await randomIpfsNftTx.wait(2)
        console.log("2 blocks has passed")
        if (developmentChains.includes(network.name)) {
            console.log("should not be here")
            const requestId = randomIpfsNftTxRct.events[1].args.requestId.toString()
            const VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            await VRFCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.address)
        }
    })
    console.log("Looking for NFT")
    console.log(`Random Nft index 0 has token URI ${await randomIpfsNft.getDogTokenUris(0)}`)

    // Dinamic SVG
    const highValue = ethers.utils.parseEther("4000")
    const dynamicSvgNft = await ethers.getContract("randomSvgNft", deployer)
    const dynamicSvgNftTx = await dynamicSvgNft.mintNFT(highValue)
    await dynamicSvgNftTx.wait(1)
    console.log(`Dynamic SVG NFT index 0 has token URI ${await dynamicSvgNft.tokenURI(0)}`)
}

module.exports.tags = ["all", "mint"]
