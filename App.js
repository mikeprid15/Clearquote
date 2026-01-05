import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./styles.css";

const supabase = createClient(
"https://dfvwysfjvpzqwmpjmfup.supabase.co",
"sb_publishable_A5yjzflmZLWzmwkYaOKL2w_eW-N02a0"
);

export default function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState("client");
  const [client, setClient] = useState({ name: "", state: "", coverage: "Liability" });
  const [quotes, setQuotes] = useState([]);
  const [explanation, setExplanation] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  if (!session) return <Auth />;

  async function saveClient() {
    const { data } = await supabase
      .from("clients")
      .insert({ agent_id: session.user.id, name: client.name, state: client.state, coverage: client.coverage })
      .select()
      .single();

    for (const q of quotes) {
      await supabase.from("quotes").insert({
        client_id: data.id,
        carrier: q.carrier,
        monthly: q.monthly,
        six_month: q.sixMonth,
        liability: q.liability,
        deductible: q.deductible
      });
    }

    alert("Comparison saved!");
  }

  return (
    <div className="dashboard">
      <h2>ClearQuote</h2>
      <div className="tabs">
        {["client","quotes","comparison","explanation","save"].map(tab => (
          <button key={tab} className={activeTab===tab?"active":""} onClick={()=>setActiveTab(tab)}>{tab.toUpperCase()}</button>
        ))}
      </div>

      {activeTab==="client" && (
        <>
          <input placeholder="Client Name" onChange={e=>setClient({...client,name:e.target.value})} />
          <input placeholder="State" onChange={e=>setClient({...client,state:e.target.value})} />
          <select onChange={e=>setClient({...client,coverage:e.target.value})}>
            <option>Liability</option>
            <option>Full</option>
          </select>
        </>
      )}

      {activeTab==="quotes" && (
        <>
          <button onClick={()=>setQuotes([...quotes,{carrier:"",monthly:"",sixMonth:"",liability:"100/300",deductible:"500"}])}>Add Quote</button>
          {quotes.map((q,i)=>(
            <div key={i}>
              <input placeholder="Carrier" onChange={e=>q.carrier=e.target.value} />
              <input placeholder="Monthly" onChange={e=>q.monthly=e.target.value} />
              <input placeholder="6 Month" onChange={e=>q.sixMonth=e.target.value} />
            </div>
          ))}
        </>
      )}

      {activeTab==="comparison" && (
        <table>
          <tbody>
            {quotes.map((q,i)=>(<tr key={i}><td>{q.carrier}</td><td>{q.monthly}</td><td>{q.sixMonth}</td></tr>))}
          </tbody>
        </table>
      )}

      {activeTab==="explanation" && (
        <>
          <button onClick={()=>setExplanation("Insurance prices vary due to coverage levels, deductibles, discounts, and how each carrier evaluates risk.")}>Generate Explanation</button>
          <p>{explanation}</p>
        </>
      )}

      {activeTab==="save" && <button onClick={saveClient}>Save Comparison</button>}
    </div>
  );
}

function Auth() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  return (
    <div className="login-container">
      <h3>ClearQuote Login</h3>
      <input placeholder="Email" onChange={e=>setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e=>setPassword(e.target.value)} />
      <button onClick={()=>supabase.auth.signUp({email,password})}>Sign Up</button>
      <button onClick={()=>supabase.auth.signInWithPassword({email,password})}>Login</button>
    </div>
  );
}
