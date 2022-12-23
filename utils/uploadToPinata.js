const pinataSDK = require("@pinata/sdk")
const path = require("path")
const fs = require("fs")
require("dotenv").config()

const pinataAPIKey = process.env.PINATA_API_KEY
const pinataAPISecret = process.env.PINATA_API_SECRET
//console.log(pinataAPIKey)
//console.log(pinataAPISecret)
const pinata = pinataSDK(pinataAPIKey, pinataAPISecret)

async function storeImages(imagesFilePath) {
    const fullImagePath = path.resolve(imagesFilePath)
    const files = fs.readdirSync(fullImagePath)
    let responses = []
    console.log("uploading to Pinata...")
    for (fileindex in files) {
        console.log(`Working on ${fileindex}`)
        const readableStreamForFile = fs.createReadStream(`${fullImagePath}/${files[fileindex]}`)
        try {
            const response = await pinata.pinFileToIPFS(readableStreamForFile)
            responses.push(response)
        } catch (error) {
            console.log(error)
        }
    }
    return { responses, files }
}

async function storeTokeUriMetadata(metadata) {
    const options = {
        pinataMetadata: {
            name: metadata.name,
        },
    }
    try {
        const response = await pinata.pinJSONToIPFS(metadata, options)
        return response
    } catch (error) {
        console.log(error)
    }
    return null
}

module.exports = { storeImages, storeTokeUriMetadata }
