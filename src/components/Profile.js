import React from "react"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { Moralis } from "moralis"
import { useState, useEffect } from "react"
import { useNotification } from "web3uikit"
import abi from "../contractData/abi.json"
import { Row, Form, Button, Card, ListGroup, Col } from "react-bootstrap"

const Profile = ({ exactlyAddress }) => {
    const [profile, setProfile] = useState("")
    const [username, setUsername] = useState("")
    const [image, setImage] = useState(null)
    const [loading, setLoading] = useState(false)
    let tokenURI = ""
    let tokenId = ""
    const [nfts, setNfts] = useState([])

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

    const APP_ID = "xgEHRf1FbWGNOWgMdk1GZjg0mfYkTbEFNkZP4iyz"
    const APP_URL = "https://z9qet1rzrbed.usemoralis.com:2053/server"
    const MASTER_KEY = "3nJewJj4F3VVyTj8uJM1VmITBU2f6woHqZXftkKC"

    const uploadImageToIpfs = async (event) => {
        event.preventDefault()
        const selectedImage = event.target.files[0]
        console.log(event.target.files[0])
        await Moralis.start({ serverUrl: APP_URL, appId: APP_ID, masterKey: MASTER_KEY })

        if (selectedImage !== undefined) {
            try {
                const file = new Moralis.File("file.json", {
                    base64: btoa(JSON.stringify(selectedImage)),
                })
                // await file.saveIPFS()
                await file.saveIPFS({ useMasterKey: true })

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
            // await file.saveIPFS()
            await file.saveIPFS({ useMasterKey: true })
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
    if (loading)
        return (
            <div className="text-center">
                <main style={{ padding: "1rem 0" }}>
                    <h2>Loading...</h2>
                </main>
            </div>
        )
    return (
        <div className="mt-4 text-center">
            {profile ? (
                <div className="mb-3">
                    <h3 className="mb-3">{profile.username}</h3>
                    <img className="mb-3" style={{ width: "400px" }} src={profile.image} />
                </div>
            ) : (
                <h4 className="mb-4">No NFT profile, please create one...</h4>
            )}

            <div className="row">
                <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: "1000px" }}>
                    <div className="content mx-auto">
                        <Row className="g-4">
                            <Form.Control
                                type="file"
                                required
                                name="file"
                                onChange={uploadImageToIpfs}
                            />
                            <Form.Control
                                onChange={(e) => setUsername(e.target.value)}
                                size="lg"
                                required
                                type="text"
                                placeholder="Username"
                            />
                            <div className="d-grid px-0">
                                <Button onClick={mintProfile} variant="primary" size="lg">
                                    Mint NFT Profile
                                </Button>
                            </div>
                        </Row>
                    </div>
                </main>
            </div>
            <div className="px-5 container">
                <Row xs={1} md={2} lg={4} className="g-4 py-5">
                    {nfts.map((nft, idx) => {
                        if (nft.id === profile.id) return
                        return (
                            <Col key={idx} className="overflow-hidden">
                                <Card>
                                    <Card.Img variant="top" src={nft.image} />
                                    <Card.Body color="secondary">
                                        <Card.Title>{nft.username}</Card.Title>
                                    </Card.Body>
                                    <Card.Footer>
                                        <div className="d-grid">
                                            <Button
                                                onClick={() => switchProfile(nft)}
                                                variant="primary"
                                                size="lg"
                                            >
                                                Set as Profile
                                            </Button>
                                        </div>
                                    </Card.Footer>
                                </Card>
                            </Col>
                        )
                    })}
                </Row>
            </div>
        </div>
    )
}

export default Profile
