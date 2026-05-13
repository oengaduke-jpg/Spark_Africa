import { useState } from "react";

export default function App() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");

  const deposit = () => {
    setBalance(balance + Number(amount));
    setAmount("");
  };

  const withdraw = () => {
    setBalance(balance - Number(amount));
    setAmount("");
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Spark Africa</h1>

      <h2>Balance: KES {balance}</h2>

      <input
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{ padding: 10, marginBottom: 10 }}
      />

      <br />

      <button onClick={deposit} style={{ marginRight: 10, padding: 10 }}>
        Deposit
      </button>

      <button onClick={withdraw} style={{ padding: 10 }}>
        Withdraw
      </button>
    </div>
  );
}
