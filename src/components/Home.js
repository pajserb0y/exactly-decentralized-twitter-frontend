import { useState } from "react"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { useState, useEffect } from "react"
import { useNotification } from "web3uikit"
import abi from "../contractData/abi.json"
import { Row, Form, Button, Card, Col } from "react-bootstrap"

const Home = ({ exactlyAddress, client }) => {
    const [hasProfile, setHasProfile] = useState(false)
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(false)
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
        setHasProfile(balance > 0) // mozda treba anonimna fja!!!
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
                let response = await fetch(`https://ipfs.io/ipfs/${postRaw.hash}`)
                const postMetadata = await response.json()

                let profileNftId = await runContractFunction({
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

                response = await fetch(uri)
                const profileMetadata = await response.json()
                const author = {
                    address: postRaw.author,
                    username: profileMetadata.username,
                    image: profileMetadata.image,
                }

                let post = {
                    id: postRaw.id,
                    content: postMetadata,
                    tipAmount: postRaw.tipAmount,
                    author,
                }

                return post
            })
        )

        posts = posts.sort((a, b) => b.tipAmount - a.tipAmount) //od onog sa najvise do onog sa najmanje tipva
        setPosts(posts)
        setLoading(false)
    }

    return <div>Home</div>
}

export default Home
