import { useMoralis, useWeb3Contract } from "react-moralis"
import { useState, useEffect } from "react"
import { useNotification } from "web3uikit"
import abi from "../contractData/abi.json"
import { Row, Form, Button, Card, Col } from "react-bootstrap"
import { Moralis } from "moralis"

const Home = ({ exactlyAddress, client }) => {
    const [hasProfile, setHasProfile] = useState(false)
    const [posts, setPosts] = useState("")
    const [loading, setLoading] = useState(true)
    const [post, setPost] = useState("")

    const { account } = useMoralis()

    const dispatch = useNotification()

    const { runContractFunction } = useWeb3Contract()

    const loadPosts = async () => {
        const balance = await runContractFunction({
            params: {
                abi: abi,
                contractAddress: exactlyAddress,
                functionName: "balanceOf",
                params: { owner: account },
            },
            onError: (error) => {
                console.log(error)
            },
        })
        setHasProfile(balance.toString() > 0)
        let result = await runContractFunction({
            params: {
                abi: abi,
                contractAddress: exactlyAddress,
                functionName: "getAllPosts",
                params: {},
            },
            onError: (error) => {
                handleNewNotificationTx("Fetching posts failed! Error on blockchain.")
            },
        })

        let posts = await Promise.all(
            result.map(async (postRaw) => {
                let response = await fetch(`https://ipfs.io/ipfs/${postRaw.hashContent}`)
                const postMetadata = await response.json()

                let profileNftId = await runContractFunction({
                    params: {
                        abi: abi,
                        contractAddress: exactlyAddress,
                        functionName: "getTokenIdForProfile",
                        params: {
                            profile: postRaw.author,
                        },
                    },
                    onError: (error) => {
                        handleNewNotificationTx("Fetching profile failed! Error on blockchain.")
                    },
                })

                const uri = await runContractFunction({
                    params: {
                        abi: abi,
                        contractAddress: exactlyAddress,
                        functionName: "tokenURI",
                        params: {
                            tokenId: profileNftId,
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
                response = await fetch(requestURL)
                const profileMetadata = await response.json()
                const author = {
                    address: postRaw.author,
                    username: profileMetadata.username,
                    image: profileMetadata.image.replace(
                        "https://ipfs.infura.io/ipfs/",
                        "https://ipfs.io/ipfs/"
                    ),
                }

                let post = {
                    id: postRaw.id,
                    content: postMetadata.post,
                    tipAmount: postRaw.tipAmount,
                    author,
                }
                console.log(post)

                return post
            })
        )

        console.log(posts)

        posts = posts.sort((a, b) => b.tipAmount - a.tipAmount) //od onog sa najvise do onog sa najmanje tipva
        setPosts(posts)
        setLoading(false)
    }

    const uploadPost = async () => {
        if (!post) {
            handleNewNotificationTx("Upload Failed! Post can't be empty.")
            return
        }
        try {
            let result = await client.add(JSON.stringify({ post }))
            let hash = result.path
            setLoading(true)
            await runContractFunction({
                params: {
                    abi: abi,
                    contractAddress: exactlyAddress,
                    functionName: "uploadPost",
                    params: {
                        _postHash: hash,
                    },
                },
                onError: (error) => {
                    handleNewNotificationTx("Upload post failed! Error on blockchain.")
                    console.log(error)
                },
                onSuccess: (tx) => handleSuccessUpload(tx),
            })
            loadPosts()
        } catch (error) {
            handleNewNotificationTx("Upload post failed! Error on IPFS.")
            console.log("Ipfs post upload error: ", error)
        }
    }

    const tipPost = async (postId) => {
        await runContractFunction({
            params: {
                abi: abi,
                contractAddress: exactlyAddress,
                functionName: "tipPost",
                params: {
                    _postId: postId,
                },
                msgValue: Moralis.Units.ETH("0.01"),
            },
            onError: (error) => {
                handleNewNotificationTx("Tiping failed! Error on blockchain.")
                console.log(error)
            },
            onSuccess: (tx) => handleSuccessTip(tx),
        })
    }

    useEffect(() => {
        if (!posts.length) loadPosts()
    })

    const handleSuccessUpload = async function (tx) {
        await tx.wait(1) //this really waits for transaction to be confirmed
        handleNewNotificationTx("Success! New post uploaded.")
    }
    const handleSuccessTip = async function (tx) {
        await tx.wait(1) //this really waits for transaction to be confirmed
        handleNewNotificationTx("Success! Post is tipped.")
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
        <div className="container-fluid mt-5">
            {hasProfile ? (
                <div className="row">
                    <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: "1000px" }}>
                        <div className="content mx-auto">
                            <Row className="g-4">
                                <Form.Control
                                    onChange={(e) => setPost(e.target.value)}
                                    size="lg"
                                    required
                                    as="textarea"
                                />
                                <div className="d-grid px-0">
                                    <Button onClick={uploadPost} variant="primary" size="lg">
                                        Post!
                                    </Button>
                                </div>
                            </Row>
                        </div>
                    </main>
                </div>
            ) : (
                <div className="text-center">
                    <main style={{ padding: "1rem 0" }}>
                        <h2>Must own an NFT to post</h2>
                    </main>
                </div>
            )}

            <p>&nbsp;</p>
            <hr />
            <p className="my-auto">&nbsp;</p>
            {posts.length > 0 ? (
                posts.map((post, key) => {
                    return (
                        <div
                            key={key}
                            className="col-lg-12 my-3 mx-auto"
                            style={{ width: "1000px" }}
                        >
                            <Card border="primary">
                                <Card.Header>
                                    <img
                                        className="mr-2"
                                        width="30"
                                        height="30"
                                        src={post.author.image}
                                    />
                                    <small className="ms-2 me-auto d-inline">
                                        {post.author.username}
                                    </small>
                                    <small className="mt-1 float-end d-inline">
                                        {post.author.address}
                                    </small>
                                </Card.Header>
                                <Card.Body color="secondary">
                                    <Card.Title>{post.content}</Card.Title>
                                </Card.Body>
                                <Card.Footer className="list-group-item">
                                    <div className="d-inline mt-auto float-start">
                                        Tip Amount: {post.tipAmount.toString()} ETH
                                    </div>
                                    {account.toLowerCase() === post.author.address.toLowerCase() ||
                                    !hasProfile ? null : (
                                        <div className="d-inline float-end">
                                            <Button
                                                onClick={() => tipPost(post.id)}
                                                className="px-0 py-0 font-size-16"
                                                variant="link"
                                                size="md"
                                            >
                                                Tip for 0.1 ETH
                                            </Button>
                                        </div>
                                    )}
                                </Card.Footer>
                            </Card>
                        </div>
                    )
                })
            ) : (
                <div className="text-center">
                    <main style={{ padding: "1rem 0" }}>
                        <h2>No posts yet</h2>
                    </main>
                </div>
            )}
        </div>
    )
}

export default Home
