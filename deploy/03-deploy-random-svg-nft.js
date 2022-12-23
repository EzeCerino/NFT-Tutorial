const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require("fs")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const chainId = network.config.chainId
    let ethPriceFeedAddress

    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await ethers.getContract("MockV3Aggregator")
        ethPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethPriceFeedAddress = networkConfig[chainId].priceFeedAddress
    }

    const lowSVG = await fs.readFileSync("./images/dynamicNft/frown.svg", { encoding: "utf8" })
    const highSVG = await fs.readFileSync("./images/dynamicNft/happy.svg", { encoding: "utf8" })

    log("----------------------------------------------------------------")
    args = [ethPriceFeedAddress, highSVG, lowSVG]
    const dynamicSvgNft = await deploy("randomSvgNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(dynamicSvgNft.address, args)
    }
    log("-----------------------------------------------------")
    // https://youtu.be/gyMwXuJrbJQ?t=83830
}

module.exports.tags = ["all", "dynamicNft", "main"]
