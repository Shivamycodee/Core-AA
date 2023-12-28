"use client";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import React,{useState} from "react";
import { useGlobalContext } from "../../context/WalletContext";
import toast from "react-hot-toast";

function Transfer() {

    const [transferTo, setTransferTo] = useState("");
    const [transferAmount, setTransferAmount] = useState("");
    const [hash, setHash] = useState(null);

    const { tokenTransferERC20, cFERC20 } =
      useGlobalContext();

    const transferCOREToken = async() => {

      if(!transferTo || !transferAmount){
            toast.error("Please fill both the fields");
            return;
        }

      const cFCOREBal = parseFloat(cFERC20);
      const transferAmountInt = parseFloat(transferAmount);

    if (transferAmountInt > cFCOREBal) {
            alert("Insufficient Balance");
            return;
    }

    let transferAmt = transferAmountInt.toString();
    const hash = await tokenTransferERC20(transferTo, transferAmt);
    setHash(hash);
    }


  return (
    <div>
      <div className="container">
        <div
          className="box"
          id="transfer-box"
          style={{ height: "33rem", marginBottom: "20px" }}
        >
          <span
            style={{ fontSize: "2rem", letterSpacing: "1px" }}
            className="title"
          >
            Transfer CORE
          </span>
          <div>
            <InputGroup className="mb-3">
              <Form.Control
                value={transferTo}
                placeholder="Transfer to..."
                aria-label="Transfer to..."
                aria-describedby="basic-addon2"
                onChange={(e) => setTransferTo(e.target.value)}
              />
            </InputGroup>

            <InputGroup style={{ marginTop: "15px" }} className="mb-3">
              <Form.Control
                value={transferAmount}
                placeholder="Transfer amount..."
                aria-label="Transfer amount..."
                aria-describedby="basic-addon2"
                onChange={(e) => setTransferAmount(e.target.value)}
              />
            </InputGroup>

            <Button
              style={{ width: "100%", marginTop: "50%" }}
              variant="outline-dark"
              onClick={transferCOREToken}
            >
              Transfer
            </Button>
          </div>
        </div>
        {hash ? (
          <a href={"https://mumbai.polygonscan.com/tx/"+hash} target="_blank">
            Transaction Hash
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default Transfer;
