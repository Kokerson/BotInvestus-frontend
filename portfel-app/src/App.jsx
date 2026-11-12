import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

function App() {
  const [portfolio, setPortfolio] = useState([]);
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");

  // Pobieranie danych przy starcie
  useEffect(() => {
    fetchPortfolio();
  }, []);

  async function fetchPortfolio() {
    const { data, error } = await supabase.from("portfolio").select("*");

    if (error) console.error("Błąd pobierania:", error);
    else setPortfolio(data);
  }

  // Dodawanie nowej akcji
  async function addStock(e) {
    e.preventDefault();
    const { error } = await supabase.from("portfolio").insert([
      {
        ticker: ticker.toUpperCase(),
        quantity: parseFloat(quantity),
        buy_price: parseFloat(buyPrice),
      },
    ]);

    if (error) {
      alert("Błąd dodawania: " + error.message);
    } else {
      setTicker("");
      setQuantity("");
      setBuyPrice("");
      fetchPortfolio(); // Odśwież listę po dodaniu
    }
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Test Bazy Supabase - Mój Portfel</h2>

      <form onSubmit={addStock} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Ticker (np. NVDA)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          required
          style={{ marginRight: "10px" }}
        />
        <input
          type="number"
          step="0.001"
          placeholder="Ilość"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          style={{ marginRight: "10px" }}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Cena zakupu"
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
          required
          style={{ marginRight: "10px" }}
        />
        <button type="submit">Dodaj do portfela</button>
      </form>

      <table
        border="1"
        cellPadding="10"
        style={{ borderCollapse: "collapse", width: "100%", maxWidth: "600px" }}
      >
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Ilość</th>
            <th>Cena zakupu</th>
          </tr>
        </thead>
        <tbody>
          {portfolio.map((item) => (
            <tr key={item.id}>
              <td>{item.ticker}</td>
              <td>{item.quantity}</td>
              <td>{item.buy_price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
