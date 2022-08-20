import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import reportWebVitals from "./reportWebVitals"
import { MoralisProvider } from "react-moralis"
import Header from "./components/Header"
import { NotificationProvider } from "web3uikit"
import { BrowserRouter } from "react-router-dom"
import "bootstrap/dist/css/bootstrap.css"

const APP_ID = "xgEHRf1FbWGNOWgMdk1GZjg0mfYkTbEFNkZP4iyz"
const APP_URL = "https://z9qet1rzrbed.usemoralis.com:2053/server"

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
    <React.StrictMode>
        <MoralisProvider appId={APP_ID} serverUrl={APP_URL}>
            <NotificationProvider>
                <BrowserRouter>
                    <Header />
                    <App />
                </BrowserRouter>
            </NotificationProvider>
        </MoralisProvider>
    </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
