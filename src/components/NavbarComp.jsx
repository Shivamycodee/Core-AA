"use client"
import React from 'react'
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import toast from "react-hot-toast";
import { useGlobalContext } from '../../context/WalletContext';

export default function NavbarComp() {

    const { connectWallet, address, setAddress, setCFAddress, userMatic } =
      useGlobalContext();

    const handleDisconnect = () => {  
        setAddress(null);
        setCFAddress("connect wallet");
        toast.success("Wallet Disconnected");
    }


  return (
    <>
      <Navbar
        collapseOnSelect
        expand="lg"
        // className="bg-body-tertiary"
      >
        <Container>
          <Navbar.Brand href="#home">360 CORE AA</Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="me-auto"></Nav>
            <Nav>
              {!address ? (
                <Button onClick={connectWallet ? connectWallet:null} variant="outline-dark">
                  Connect Wallet
                </Button>
              ) : (
                <>
                  <Button
                    style={{ marginRight: "10px" }}
                    variant="outline-dark"
                  >
                   Matic: {userMatic}
                  </Button>
                  <Button
                    style={{ marginRight: "10px" }}
                    variant="outline-dark"
                  >
                    {address.slice(0, 4)}...{address.slice(-4)}
                  </Button>
                  <Button onClick={handleDisconnect} variant="outline-dark">
                    Disconnect Wallet
                  </Button>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
}
