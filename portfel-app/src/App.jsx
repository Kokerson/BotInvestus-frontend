import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#ffc658",
  "#ef5350",
  "#8d6e63",
];

function App() {
  const [portfolio, setPortfolio] = useState([]);
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [currency, setCurrency] = useState("PLN");

  const [usdToPln, setUsdToPln] = useState(4.0);

  useEffect(() => {
    fetchPortfolio();
    fetchExchangeRate();
  }, []);

  async function fetchExchangeRate() {
    try {
      // Darmowe API NBP (brak problemów z CORS)
      const res = await fetch(
        "https://api.nbp.pl/api/exchangerates/rates/a/usd/?format=json",
      );
      if (!res.ok) throw new Error("Błąd sieci API NBP");
      const data = await res.json();

      const kurs = data.rates[0].mid;
      setUsdToPln(kurs);
    } catch (error) {
      console.error("Błąd pobierania kursu z NBP:", error);
      setUsdToPln(4.0); // Wartość awaryjna
    }
  }

  async function fetchPortfolio() {
    const { data, error } = await supabase.from("portfolio").select("*");
    if (error) {
      console.error("Błąd pobierania:", error);
    } else {
      setPortfolio(data || []);
    }
  }

  async function addStock(e) {
    e.preventDefault();
    const { error } = await supabase.from("portfolio").insert([
      {
        ticker: ticker.toUpperCase(),
        quantity: parseFloat(quantity),
        buy_price: parseFloat(buyPrice),
        currency: currency,
      },
    ]);

    if (error) alert("Błąd dodawania: " + error.message);
    else {
      setTicker("");
      setQuantity("");
      setBuyPrice("");
      setCurrency("PLN");
      fetchPortfolio();
    }
  }

  async function deleteStock(id) {
    const { error } = await supabase.from("portfolio").delete().eq("id", id);
    if (error) alert("Błąd usuwania: " + error.message);
    else fetchPortfolio();
  }

  const chartData = (portfolio || [])
    .map((item) => {
      const itemCurrency = item.currency || "PLN";
      const rate = itemCurrency === "USD" ? usdToPln : 1;

      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.buy_price) || 0;
      const investedPln = qty * price * rate;

      return {
        name: item.ticker || "Nieznany",
        value: parseFloat(investedPln.toFixed(2)),
      };
    })
    .filter((item) => item.value > 0);

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
        color: "white",
      }}
    >
      <h2>Mój Portfel Inwestycyjny</h2>
      <p>
        Aktualny kurs USD/PLN: <strong>{usdToPln} zł</strong>
      </p>

      <div
        style={{
          marginBottom: "30px",
          padding: "15px",
          background: "#333",
          borderRadius: "8px",
        }}
      >
        <form
          onSubmit={addStock}
          style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
        >
          <input
            type="text"
            placeholder="Ticker (np. NVDA)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            required
          />
          <input
            type="number"
            step="0.001"
            placeholder="Ilość"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Cena zakupu"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            required
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="PLN">PLN</option>
            <option value="USD">USD</option>
          </select>
          <button type="submit">Dodaj do portfela</button>
        </form>
      </div>

      {portfolio.length > 0 && chartData.length > 0 && (
        <div style={{ height: "350px", marginBottom: "30px" }}>
          <h3 style={{ textAlign: "center" }}>Alokacja kapitału (PLN)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} PLN`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <table
        border="1"
        cellPadding="10"
        style={{
          borderCollapse: "collapse",
          width: "100%",
          textAlign: "left",
          borderColor: "#555",
        }}
      >
        <thead style={{ background: "#444" }}>
          <tr>
            <th>Ticker</th>
            <th>Ilość</th>
            <th>Cena zakupu</th>
            <th>Wartość (PLN)</th>
            <th>Akcja</th>
          </tr>
        </thead>
        <tbody>
          {(portfolio || []).map((item) => {
            const itemCurrency = item.currency || "PLN";
            const rate = itemCurrency === "USD" ? usdToPln : 1;
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.buy_price) || 0;
            const totalValue = (qty * price * rate).toFixed(2);

            return (
              <tr key={item.id}>
                <td>
                  <strong>{item.ticker}</strong>
                </td>
                <td>{qty}</td>
                <td>
                  {price} {itemCurrency}
                </td>
                <td>{totalValue} PLN</td>
                <td>
                  <button
                    onClick={() => deleteStock(item.id)}
                    style={{
                      color: "#ff6b6b",
                      cursor: "pointer",
                      background: "none",
                      border: "none",
                      fontWeight: "bold",
                    }}
                  >
                    Usuń
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default App;
