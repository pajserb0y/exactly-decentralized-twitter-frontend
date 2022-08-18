import { Navbar, Nav } from "react-bootstrap"
import { ConnectButton } from "web3uikit"
import { Link } from "react-router-dom"
import logo from "../logo.png"
const Header = () => {
    return (
        <Navbar expand="lg" className="p-1 border-b2 flex flex-row">
            <Navbar.Brand>
                <div>
                    <Link to="/">
                        <img src={logo} width="280" height="120" />
                    </Link>
                </div>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse className=" justify-end">
                <Nav className="flex flex-row   py-11">
                    <Nav.Link as={Link} to="/">
                        <div className="font-medium mx-10  text-blue-400">Home</div>
                    </Nav.Link>
                    <Nav.Link as={Link} to="/profile">
                        <div className="font-medium mx-10 text-blue-400">Profile</div>
                    </Nav.Link>
                </Nav>
            </Navbar.Collapse>
            {/* <h1 className="py-2 px-4 font-bold  text-3xl">Exactly - Decentalized Twitter</h1> */}
            <div className="ml-auto py-8 px-4">
                <ConnectButton moralisAuth={false} />
            </div>
        </Navbar>
    )
}

export default Header
