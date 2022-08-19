import "./App.css"
import { useMoralis } from "react-moralis"
import contractAddresses from "./contractData/contractAddresses.json"
import { useEffect } from "react"
import { Routes, Route } from "react-router-dom"
import Profile from "./components/Profile"
import { Spinner } from "react-bootstrap"

function App() {
    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const exactlyAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null

    useEffect(() => {
        if (isWeb3Enabled) {
        }
    }, [isWeb3Enabled])

    return (
        <div>
            {isWeb3Enabled ? (
                <div>
                    {exactlyAddress ? (
                        <Routes>
                            <Route
                                path="/profile"
                                element={<Profile exactlyAddress={exactlyAddress} />}
                            />
                            {/* <Route path="/" element={<Home />} /> */}
                        </Routes>
                    ) : (
                        <div>Contract not detected</div>
                    )}
                </div>
            ) : (
                <div className="ml-auto py-2 bg-blue-50 flex-row">
                    <h1 className="py-4 font-semibold text-blue-500 text-4xl flex justify-center">
                        WELCOME TO THE FIRST DECENTRALIZED TWITTER
                    </h1>
                    <h2 className="py-4  font-extralight text-2xl flex justify-center">
                        Platform which offers you full freedom to express yourself
                    </h2>
                    <Spinner
                        animation="border"
                        variant="primary"
                        className="flex justify-center"
                    />
                    <h3 className="py-10  font-extralight text-2xl flex justify-center ">
                        Please connect your wallet
                    </h3>
                </div>
            )}
        </div>
    )
}

export default App
