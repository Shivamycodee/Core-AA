"use client";
import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import { useGlobalContext } from "../../context/WalletContext";
import {YINGAddress,YANGAddress,SwapContract} from "../assets/data.js";

export default function Swap() {
  const {
    swapToken,
    setSwapToken,
    checkAllowance,
    address,
    approveToken,
    cFAddress,
    ProfessionalSwap,
    hashList,
    ERC20ProfessionalSwap,
  } = useGlobalContext();

  const [swapAmount, setSwapAmount] = useState("");
  const [isApproved, setIsApproved] = useState([false, false]);

  const handleSwapChange = () => {
    setSwapToken([swapToken[1], swapToken[0]]);
    console.log("Swap Change");
  };

  const handleApprove = async (token) => {
    if (token === "YING") {
      await approveToken(YINGAddress, SwapContract);
    } else {
      await approveToken(YANGAddress, SwapContract);
    }
  };

  const handleSwap = async () => {
    console.log("SWAP-1");

    if (swapToken[0] === "YING") {
      await ProfessionalSwap(YINGAddress, swapAmount, true);
    } else {
      await ProfessionalSwap(YANGAddress, swapAmount, false);
    }
  };

  const handleSwapERC20 = async () => {
    console.log("SWAP-ERC20");

    if (swapToken[0] === "YING") {
      await ERC20ProfessionalSwap(YINGAddress, swapAmount, true);
    } else {
      await ERC20ProfessionalSwap(YANGAddress, swapAmount, false);
    }
  };

  useEffect(() => {
    if (address && cFAddress) {
      const check = async () => {
        try{
          const isIApprove = await checkAllowance(YINGAddress);
          const isAApprove = await checkAllowance(YANGAddress);
          setIsApproved([isIApprove, isAApprove]);
          console.info("YING | YANG APPROVAL : ", isIApprove, isAApprove);
        }catch(e){
          console.error("ERROR CHECKING APPROVAL : ", e);
        }

      };

      check();
    }
  }, [cFAddress, hashList]);

  return (
    <div>
      <div className="container">
        <div className="box" style={{ height: "33rem", marginBottom: "20px" }}>
          {!isApproved[0] || !isApproved[1] ? (
            <h4 style={{color:"red"}}>
              <u>Approve the token first.</u>
            </h4>
          ) : null}
          <span
            style={{ fontSize: "2rem", letterSpacing: "1px" }}
            className="title"
          >
            Swap
          </span>
          <div>
            <InputGroup className="mb-3">
              <Form.Control
                value={swapAmount} // Ensure this is set to make the input controlled
                placeholder="Enter amount..."
                aria-label="Enter amount..."
                aria-describedby="basic-addon2"
                onChange={(e) => setSwapAmount(e.target.value)}
              />

              <InputGroup.Text id="basic-addon2">
                {swapToken[0]}
              </InputGroup.Text>
            </InputGroup>

            <svg
              onClick={handleSwapChange}
              className="loop-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="38"
              fill="none"
              viewBox="0 0 25 24"
              id="loop"
            >
              <g clipPath="url(#clip0_202_26533)">
                <path
                  fill="#000"
                  d="M12.6022 0C5.98517 0 0.602173 5.383 0.602173 12C0.602173 18.617 5.98517 24 12.6022 24C19.2192 24 24.6022 18.617 24.6022 12C24.6022 5.383 19.2192 0 12.6022 0ZM9.55317 17.762C9.45817 17.912 9.29617 17.994 9.13017 17.994C9.03917 17.994 8.94617 17.969 8.86317 17.916C6.82117 16.625 5.60217 14.413 5.60217 12C5.60217 8.14 8.74217 5 12.6022 5C12.7062 5 12.8082 5.009 12.9102 5.015L11.7482 3.853C11.5532 3.658 11.5532 3.341 11.7482 3.146C11.9432 2.951 12.2602 2.951 12.4552 3.146L14.4552 5.146C14.6502 5.341 14.6502 5.658 14.4552 5.853L12.4552 7.853C12.3582 7.951 12.2302 8 12.1022 8C11.9742 8 11.8462 7.951 11.7482 7.854C11.5532 7.659 11.5532 7.342 11.7482 7.147L12.8802 6.015C12.7882 6.008 12.6962 6 12.6022 6C9.29317 6 6.60217 8.691 6.60217 12C6.60217 14.068 7.64717 15.964 9.39817 17.072C9.63117 17.22 9.70117 17.529 9.55317 17.762ZM12.6022 19C12.4982 19 12.3962 18.991 12.2942 18.985L13.4562 20.147C13.6512 20.342 13.6512 20.659 13.4562 20.854C13.3582 20.951 13.2302 21 13.1022 21C12.9742 21 12.8462 20.951 12.7482 20.854L10.7482 18.854C10.5532 18.659 10.5532 18.342 10.7482 18.147L12.7482 16.147C12.9432 15.952 13.2602 15.952 13.4552 16.147C13.6502 16.342 13.6502 16.659 13.4552 16.854L12.3232 17.986C12.4162 17.992 12.5082 18 12.6022 18C15.9112 18 18.6022 15.309 18.6022 12C18.6022 9.937 17.5612 8.044 15.8182 6.936C15.5852 6.788 15.5162 6.479 15.6652 6.246C15.8132 6.014 16.1212 5.945 16.3552 6.093C18.3882 7.385 19.6022 9.594 19.6022 12C19.6022 15.86 16.4622 19 12.6022 19Z"
                ></path>
              </g>
              <defs>
                <clipPath id="clip0_202_26533">
                  <rect
                    width="24"
                    height="24"
                    fill="#fff"
                    transform="translate(.602)"
                  ></rect>
                </clipPath>
              </defs>
            </svg>

            <InputGroup style={{ marginTop: "15px" }} className="mb-3">
              <Form.Control
                placeholder="Enter amount..."
                aria-label="Enter amount..."
                aria-describedby="basic-addon2"
                value={swapAmount}
                readOnly
              />
              <InputGroup.Text id="basic-addon2">
                {swapToken[1]}
              </InputGroup.Text>
            </InputGroup>

            {isApproved[0] && isApproved[1] ? (
              <>
                <Button
                  style={{ width: "100%", marginTop: "20%" }}
                  variant="outline-dark"
                  onClick={handleSwap}
                >
                  SWAP
                </Button>

                <Button
                  style={{ width: "100%", marginTop: "2%", marginBottom: "4%" }}
                  variant="outline-dark"
                  onClick={handleSwapERC20}
                >
                  SWAP With CORE
                </Button>
              </>
            ) : null}
            {!isApproved[0] ? (
              <Button
                style={{ width: "100%", marginTop: "2%" }}
                variant="outline-dark"
                onClick={() => handleApprove("YING")}
              >
                Approve YING
              </Button>
            ) : null}

            {!isApproved[1] ? (
              <Button
                style={{ width: "100%", marginTop: "1px" }}
                variant="outline-dark"
                onClick={() => handleApprove("YANG")}
              >
                Approve YANG
              </Button>
            ) : null}
          </div>
        </div>
        {hashList ? (
          <a href={hashList} target="_blank">
            Transaction Hash
          </a>
        ) : null}
      </div>
    </div>
  );
}
