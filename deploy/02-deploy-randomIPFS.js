const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImages, storeTokeUriMetadata } = require("../utils/uploadToPinata")

imagesLocation = "./images/randomNft"

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [{ trait_type: "Cuteness", value: 100 }],
}

FUND_AMOUNT = "10000000000000000000"

let tokenURIs = [
    "ipfs://QmXaTF4yQP1X4RKXg2u43yH2XxZmCtjN8Hg9GVs85scwVQ",
    "ipfs://QmZYP1Hjprceyu9Dv8Zv3dEMNS9FqJCdo84zyyp95roioD",
    "ipfs://QmSnBXUuDoFZEDa2tiJdzVCC6yRGP9i5wG8CkKkg5VWdaB",
]

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    //load into pinata
    if (process.env.UPLOAD_TO_PINATA == "true") {
        console.log("handle token URI")
        tokenURIs = await handleTokenUris()
    }

    let vrfCoordinatorV2address, subscriptionID
    //console.log(network.name)
    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2address = vrfCoordinatorV2Mock.address
        //console.log(vrfCoordinatorV2address)
        const tx = await vrfCoordinatorV2Mock.createSubscription()
        const txRecepti = await tx.wait(1)
        subscriptionID = txRecepti.events[0].args.subId.toString()
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionID, FUND_AMOUNT)
    } else {
        //console.log("Entro al else")
        vrfCoordinatorV2address = networkConfig[chainId].VRFCoordinatorV2
        //vrfCoordinatorV2address = networkConfig[chainId]["VRFCoordinatorV2"]
        subscriptionID = networkConfig[chainId].subscriptionID
        //subscriptionID = networkConfig[chainId]["subscriptionID"]
        //subscriptionID = "3661"
    }

    log("---------------------------------------------------------")

    //await storeImages(imagesLocation)

    //creates arguments for the contract's constructor.
    const args = [
        vrfCoordinatorV2address,
        subscriptionID,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].callbackGasLimit,
        tokenURIs,
        networkConfig[chainId].mintFee,
    ]
    //console.log("prinring args")
    //console.log(args)

    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    //// adding consumer to VRFMOCK
    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        const tx2 = await vrfCoordinatorV2Mock.addConsumer(subscriptionID, randomIpfsNft.address)
        const tx2R = await tx2.wait(1)
        const consumerSubId = tx2R.events[0].args.subId.toString()
        const consumeradded = tx2R.events[0].args.consumer.toString()
        console.log(`Subscription ID is: ${consumerSubId}`)
        console.log(`the ${consumeradded} whas added`)
    }

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(randomIpfsNft.address, args)
    }
    log("-----------------------------------------------------")
}

async function handleTokenUris() {
    tokenURIs = []
    const { responses: imageUploadResponses, files } = await storeImages(imagesLocation)
    for (imageUploadResponsesIndex in imageUploadResponses) {
        let tokenUriMetada = { ...metadataTemplate }
        tokenUriMetada.name = files[imageUploadResponsesIndex].replace(".png", "")
        tokenUriMetada.description = `This is an adorable ${tokenUriMetada.name} puppy!!`
        tokenUriMetada.image = `ipfs://${imageUploadResponses[imageUploadResponsesIndex].IpfsHash}`
        console.log(`updating ${tokenUriMetada.name}...`)
        // upload metada to pinata
        const metadataUploadResoonse = await storeTokeUriMetadata(tokenUriMetada)
        tokenURIs.push(`ipfs://${metadataUploadResoonse.IpfsHash}`)
    }
    console.log(tokenURIs)
    return tokenURIs
}

module.exports.tags = ["all", "randomipfs", "main"]
