import "./App.css"
import { useMoralis } from "react-moralis"
import contractAddresses from "./contractData/contractAddresses.json"
import { Routes, Route } from "react-router-dom"
import Profile from "./components/Profile"
import Home from "./components/Home"
import { Spinner } from "react-bootstrap"
import { create as ipfsHttpClient } from "ipfs-http-client"

const projectId = "2DaxOELfi3UtdbYwHRGzW8y2bu3"
const projectSecret = "3130a43c765a79f9c127ec5c7da3e4de"
const authorization = "Basic " + btoa(projectId + ":" + projectSecret)

let client = ipfsHttpClient({
    url: "https://ipfs.infura.io:5001/api/v0",
    headers: {
        authorization,
    },
})

function App() {
    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const exactlyAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null

    return (
        <div>
            {isWeb3Enabled ? (
                <div>
                    {exactlyAddress ? (
                        <Routes>
                            <Route
                                path="/profile"
                                element={
                                    <Profile exactlyAddress={exactlyAddress} client={client} />
                                }
                            />
                            <Route
                                path="/"
                                element={<Home exactlyAddress={exactlyAddress} client={client} />}
                            />
                        </Routes>
                    ) : (
                        <div>Contract not detected</div>
                    )}
                </div>
            ) : (
                <div className="ml-auto py-2 bg-blue-50 flex-col">
                    <h1 className="py-4 font-semibold text-blue-500 text-4xl flex justify-center">
                        WELCOME TO THE FIRST DECENTRALIZED TWITTER
                    </h1>
                    <h2 className="py-4  font-extralight text-2xl flex justify-center">
                        Platform which offers you full freedom to express yourself
                    </h2>

                    <h4 className="py-4  font-extralight text-2xl flex justify-center ">
                        Please connect your wallet
                    </h4>
                    <div className=" pb-4 flex justify-center">
                        <Spinner animation="border" variant="primary" />
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
