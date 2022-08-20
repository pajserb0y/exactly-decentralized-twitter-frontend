import { useMoralis, useWeb3Contract } from "react-moralis"
import { useState, useEffect } from "react"
import { useNotification } from "web3uikit"
import abi from "../contractData/abi.json"
import { Row, Form, Button, Card, Col } from "react-bootstrap"

const Profile = ({ exactlyAddress, client }) => {
    const [profile, setProfile] = useState("")
    const [username, setUsername] = useState("")
    const [image, setImage] = useState(null)
    const [loading, setLoading] = useState(true)

    const [nfts, setNfts] = useState([])

    const { account } = useMoralis()

    const dispatch = useNotification()

    const { runContractFunction } = useWeb3Contract()

    const loadMyNfts = async () => {
        const nftIds = await runContractFunction({
            params: {
                abi: abi,
                contractAddress: exactlyAddress,
                functionName: "getMyNfts",
                params: {},
            },
            onError: (error) => {
                handleNewNotificationTx("Fetching NFTs failed! Error on blockchain.")
            },
        })
        let nfts = await Promise.all(
            nftIds.map(async (id) => {
                let tokenId = id.toString()

                const uri = await runContractFunction({
                    params: {
                        abi: abi,
                        contractAddress: exactlyAddress,
                        functionName: "tokenURI",
                        params: {
                            tokenId: tokenId,
                        },
                    },
                    onError: (error) => {
                        handleNewNotificationTx("Fetching NFTs failed! Error on blockchain.")
                    },
                })
                const requestURL = uri.replace(
                    "https://ipfs.infura.io/ipfs/",
                    "https://ipfs.io/ipfs/"
                )
                const response = await fetch(requestURL)
                const metadata = await response.json()

                return {
                    id: tokenId,
                    username: metadata.username,
                    image: metadata.image.replace(
                        "https://ipfs.infura.io/ipfs/",
                        "https://ipfs.io/ipfs/"
                    ),
                }
            })
        )

        setNfts(nfts)
        getProfile(nfts)
    }

    const getProfile = async (nfts) => {
        const tokenId = await runContractFunction({
            params: {
                abi: abi,
                contractAddress: exactlyAddress,
                functionName: "getTokenIdForProfile",
                params: {
                    profile: account,
                },
            },
            onError: (error) => {
                handleNewNotificationTx("Fetching profile failed! Error on blockchain.")
            },
        })

        const profile = nfts.find((nft) => nft.id == tokenId.toString())

        setProfile(profile)
        setLoading(false)
    }

    const uploadImageToIpfs = async (event) => {
        event.preventDefault()
        const selectedImage = event.target.files[0]

        if (selectedImage !== undefined) {
            try {
                const result = await client.add(selectedImage)
                setImage(`https://ipfs.io/ipfs/${result.path}`)
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
            const result = await client.add(JSON.stringify({ image, username }))
            setLoading(true)
            let tokenURI = `https://ipfs.io/ipfs/${result.path}`
            await runContractFunction({
                params: {
                    abi: abi,
                    contractAddress: exactlyAddress,
                    functionName: "mint",
                    params: {
                        _tokenURI: tokenURI,
                    },
                },
                onError: (error) => {
                    handleNewNotificationTx("Mint failed! Error on blockchain.")
                    console.log(error)
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
        let tokenId = nft.id
        await runContractFunction({
            params: {
                abi: abi,
                contractAddress: exactlyAddress,
                functionName: "setProfile",
                params: {
                    _tokenId: tokenId,
                },
            },
            onError: (error) => {
                handleNewNotificationTx("Setting profile failed! Error on blockchain.")
            },
            onSuccess: () => handleSuccess,
        })
        getProfile(nfts)
    }

    useEffect(() => {
        if (!nfts.length) loadMyNfts()
    })

    const handleSuccess = async function (tx) {
        console.log("USAAOOOOOOOOO")
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
                <div className="flex flex-col mb-3">
                    <h3 className=" mb-3">{profile.username}</h3>
                    <div className=" flex justify-center mb-3">
                        <img style={{ width: "300px" }} src={profile.image} />
                    </div>
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
