import { useState, useEffect } from "react"; import { Card, CardContent } from "@/components/ui/card"; import { Button } from "@/components/ui/button"; import { Input } from "@/components/ui/input"; import { Home, Users, CreditCard, Wallet, Menu, Lock, Shield, FileText, Download } from "lucide-react";

import { initializeApp } from "firebase/app"; import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore"; import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";

// ================= FIREBASE ================= const firebaseConfig = { apiKey: "YOUR_API_KEY", authDomain: "YOUR_AUTH_DOMAIN", projectId: "spark-africa", storageBucket: "YOUR_BUCKET", messagingSenderId: "YOUR_SENDER_ID", appId: "YOUR_APP_ID" };

const app = initializeApp(firebaseConfig); const db = getFirestore(app); const auth = getAuth(app);

// ================= MAIN APP ================= export default function SparkAfricaMobile() { const [user, setUser] = useState(null); const [role, setRole] = useState("admin"); // admin / agent

// auth const [email, setEmail] = useState(""); const [password, setPassword] = useState("");

// data const [members, setMembers] = useState([]); const [loans, setLoans] = useState([]); const [transactions, setTransactions] = useState([]);

// wallet system const [wallets, setWallets] = useState({});

// forms const [memberId, setMemberId] = useState(""); const [amount, setAmount] = useState(""); const [interest, setInterest] = useState(10); const [repay, setRepay] = useState({});

const [selectedMember, setSelectedMember] = useState(null);

// ================= AUTH ================= useEffect(() => { onAuthStateChanged(auth, (u) => setUser(u)); }, []);

const login = async () => { try { await signInWithEmailAndPassword(auth, email, password); } catch { alert("Login failed"); } };

const logout = () => signOut(auth);

// ================= LOAD DATA ================= const loadData = async () => { const usersSnap = await getDocs(collection(db, "users")); const loansSnap = await getDocs(collection(db, "loans")); const txSnap = await getDocs(collection(db, "transactions")); const walletSnap = await getDocs(collection(db, "wallets"));

setMembers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
setLoans(loansSnap.docs.map(d => ({ id: d.id, ...d.data() })));
setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() })));

const w = {};
walletSnap.forEach(d => w[d.id] = d.data().balance);
setWallets(w);

};

useEffect(() => { if (user) loadData(); }, [user]);

// ================= WALLET SYSTEM ================= const deposit = async (id, amt) => { const ref = doc(db, "wallets", id); await updateDoc(ref, { balance: (wallets[id] || 0) + amt });

await addDoc(collection(db, "transactions"), {
  type: "deposit",
  memberId: id,
  amount: amt,
  createdAt: serverTimestamp()
});

sendSMS(id, "Deposit received successfully");
loadData();

};

const withdraw = async (id, amt) => { if ((wallets[id] || 0) < amt) return alert("Insufficient balance");

await updateDoc(doc(db, "wallets", id), {
  balance: wallets[id] - amt
});

await addDoc(collection(db, "transactions"), {
  type: "withdraw",
  memberId: id,
  amount: amt,
  createdAt: serverTimestamp()
});

sendSMS(id, "Withdrawal processed");
loadData();

};

// ================= SMS / WHATSAPP (MOCK) ================= const sendSMS = (id, message) => { console.log(SMS to ${id}: ${message}); };

const sendWhatsApp = (id, message) => { console.log(WhatsApp to ${id}: ${message}); };

// ================= PDF RECEIPT ================= const generateReceipt = (tx) => { const content = Receipt\nType: ${tx.type}\nAmount: ${tx.amount}; const blob = new Blob([content], { type: "text/plain" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "receipt.txt"; a.click(); };

// ================= CREDIT SCORE ================= const creditScore = (id) => { const userLoans = loans.filter(l => l.memberId === id); let score = 100;

userLoans.forEach(l => {
  if (l.status === "closed") score += 5;
  if (l.balance > l.totalPayable * 0.5) score -= 10;
});

return Math.max(0, Math.min(100, score));

};

// ================= ISSUE LOAN ================= const issueLoan = async () => { if (!memberId || !amount) return;

const total = amount + (amount * interest) / 100;

await addDoc(collection(db, "loans"), {
  memberId,
  amount,
  interest,
  totalPayable: total,
  balance: total,
  status: "active",
  createdAt: serverTimestamp(),
  createdBy: user.email
});

await addDoc(collection(db, "transactions"), {
  type: "loan_issued",
  memberId,
  amount,
  createdAt: serverTimestamp()
});

sendWhatsApp(memberId, "Loan issued successfully");
loadData();

};

// ================= REPAYMENT ================= const repayLoan = async (loan) => { const amt = parseFloat(repay[loan.id] || 0); if (!amt) return;

const newBal = loan.balance - amt;

await updateDoc(doc(db, "loans", loan.id), {
  balance: newBal <= 0 ? 0 : newBal,
  status: newBal <= 0 ? "closed" : "active"
});

await addDoc(collection(db, "transactions"), {
  type: "repayment",
  memberId: loan.memberId,
  amount: amt,
  createdAt: serverTimestamp()
});

sendSMS(loan.memberId, "Payment received");
generateReceipt({ type: "repayment", amount: amt });

loadData();

};

// ================= SECURITY RULES (REFERENCE ONLY) ================= /* FIRESTORE RULES (IMPORTANT - NOT IN CODE):

Only authenticated users can read/write

Only admin can issue loans

Agents can only view members

Transactions are read-only logs */


// ================= LOGIN ================= if (!user) { return ( <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4"> <Card className="w-full max-w-sm"> <CardContent className="p-6 grid gap-3"> <Shield className="mx-auto" /> <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /> <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} /> <Button onClick={login}>Login</Button> </CardContent> </Card> </div> ); }

// ================= UI ================= return ( <div className="min-h-screen bg-gray-100 flex flex-col">

<div className="flex justify-between p-4 bg-green-600 text-white">
    <Menu />
    <h1>Spark Africa ({role})</h1>
    <Button size="sm" onClick={logout}>Logout</Button>
  </div>

  {/* DASHBOARD */}
  <div className="p-4 grid gap-3">
    <Card><CardContent>Members: {members.length}</CardContent></Card>
    <Card><CardContent>Loans: {loans.length}</CardContent></Card>
    <Card><CardContent>Transactions: {transactions.length}</CardContent></Card>
  </div>

  {/* WALLET SYSTEM */}
  <div className="p-4">
    <h2 className="font-bold">Wallet System</h2>
    {members.map(m => (
      <Card key={m.id} className="mb-2">
        <CardContent>
          <p>{m.name}</p>
          <p>Balance: {wallets[m.id] || 0}</p>
          <Button onClick={() => deposit(m.id, 100)}>Deposit 100</Button>
          <Button onClick={() => withdraw(m.id, 50)}>Withdraw 50</Button>
        </CardContent>
      </Card>
    ))}
  </div>

  {/* MEMBERS */}
  <div className="p-4">
    {members.map(m => (
      <Card key={m.id} className="mb-2">
        <CardContent>
          <p>{m.name}</p>
          <p>Credit Score: {creditScore(m.id)}</p>
          <Button onClick={() => setSelectedMember(m.id)}>Open</Button>
        </CardContent>
      </Card>
    ))}
  </div>

  {/* LOAN ISSUE */}
  <div className="p-4 grid gap-2">
    <Input placeholder="Member ID" value={memberId} onChange={e => setMemberId(e.target.value)} />
    <Input placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
    <Input placeholder="Interest" value={interest} onChange={e => setInterest(e.target.value)} />
    <Button onClick={issueLoan}>Issue Loan</Button>
  </div>

  {/* NAV */}
  <div className="mt-auto flex justify-around p-3 bg-white">
    <Home /><Users /><CreditCard /><Wallet /><FileText />
  </div>
</div>

); }
