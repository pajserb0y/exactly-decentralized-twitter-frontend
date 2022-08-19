import React from "react"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { Moralis } from "moralis"
import { useState } from "react"
import { useNotification } from "web3uikit"
import abi from "../contractData/abi.json"

const Profile = ({ exactlyAddress }) => {
    const [profile, setProfile] = useState("")
    const [username, setUsername] = useState("")
    const [image, setImage] = useState(null)
    const [loading, setLoading] = useState(false)
    let tokenURI = ""
    let tokenId = ""
    const [nfts, setNfts] = useState("")

    const { account } = useMoralis()

    const dispatch = useNotification()

    const {
        runContractFunction: mint,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: exactlyAddress,
        functionName: "mint",
        params: {
            _tokenURI: tokenURI,
        },
    })

    const { runContractFunction: getMyNfts } = useWeb3Contract({
        abi: abi,
        contractAddress: exactlyAddress,
        functionName: "getMyNfts",
        params: {},
    })

    const { runContractFunction: getTokenURI } = useWeb3Contract({
        abi: abi,
        contractAddress: exactlyAddress,
        functionName: "tokenURI",
        params: {
            tokenId: tokenId,
        },
    })

    const { runContractFunction: getTokenIdForProfile } = useWeb3Contract({
        abi: abi,
        contractAddress: exactlyAddress,
        functionName: "getTokenIdForProfile",
        params: {
            profile: account,
        },
    })

    const { runContractFunction: setNewProfile } = useWeb3Contract({
        abi: abi,
        contractAddress: exactlyAddress,
        functionName: "setProfile",
        params: {
            _tokenId: tokenId,
        },
    })

    const loadMyNfts = async () => {
        const nftIds = await getMyNfts({
            onError: (error) => {
                handleNewNotificationTx("Fetching NFTs failed! Error on blockchain.")
            },
        })

        const nfts = await Promise.all(
            nftIds.map(async (id) => {
                tokenId = id

                const uri = await getTokenURI({
                    onError: (error) => {
                        handleNewNotificationTx("Fetching NFTs failed! Error on blockchain.")
                    },
                })

                const response = await fetch(uri)
                const metadata = await response.json()

                return {
                    id: tokenId,
                    username: metadata.username,
                    image: metadata.image,
                }
            })
        )
        setNfts(nfts)
        getProfile()
    }

    const getProfile = async () => {
        const tokenId = await getTokenIdForProfile({
            onError: (error) => {
                handleNewNotificationTx("Fetching profile failed! Error on blockchain.")
            },
        })
        const profile = nfts.find((nft) => nft.id.toString() === tokenId.toString())
        setProfile(profile)
        setLoading(false)
    }

    const uploadImageToIpfs = async (event) => {
        event.preventDefault()
        const selectedImage = event.target.files[0]
        if (selectedImage !== undefined) {
            try {
                const file = new Moralis.File("file.json", {
                    base64: btoa(JSON.stringify(selectedImage)),
                })
                await file.saveIPFS()

                setImage(file.url)
                console.log(`Images's IPFS url: ${file.ipfs()} and IPFS hash ${file.hash()}`)
            } catch (error) {
                handleNewNotificationTx("Upload image failed! Error on IPFS.")
                console.log("Ipsf image upload error: ", error)
            }
        }
    }

    const mintProfile = async () => {
        if (!image || !username) {
            handleNewNotificationTx("Mint Failed! Username and image must be choosen.")
            return
        }
        try {
            const file = new Moralis.File("file.json", {
                base64: btoa(JSON.stringify({ image, username })),
            })
            await file.saveIPFS()
            setLoading(true)
            tokenURI = file.ipfs()
            await mint({
                onError: (error) => {
                    handleNewNotificationTx("Mint failed! Error on blockchain.")
                },
                onSuccess: () => handleSuccess,
            })
            loadMyNfts()
        } catch (error) {
            handleNewNotificationTx("Mint failed! Error on IPFS.")
            console.log("Ipfs tokenUri upload error: ", error)
        }
    }

    const switchProfile = async (nft) => {
        setLoading(true)
        tokenId = nft.id
        await setNewProfile({
            onError: (error) => {
                handleNewNotificationTx("Setting profile failed! Error on blockchain.")
            },
            onSuccess: () => handleSuccess,
        })
        getProfile()
    }

    useEffect(() => {
        if (!nfts) loadMyNfts()
    })

    const handleSuccess = async function (tx) {
        await tx.wait(1) //this really waits for transaction to be confirmed
        handleNewNotificationTx("Success! New profile set.")
    }

    const handleNewNotificationTx = function (message) {
        dispatch({
            type: "info",
            message: message,
            title: "Tx Notification",
            position: "topR",
            icon: "bell",
        })
    }

    return <div>Cao sa profile</div>
}

export default Profile
