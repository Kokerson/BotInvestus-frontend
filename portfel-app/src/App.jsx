import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

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
      const res = await fetch(
        "https://api.nbp.pl/api/exchangerates/rates/a/usd/?format=json",
      );
      if (!res.ok) throw new Error("Błąd sieci API NBP");
      const data = await res.json();
      setUsdToPln(data.rates[0].mid);
    } catch (error) {
      console.error("Błąd pobierania kursu z NBP:", error);
      setUsdToPln(4.0);
    }
  }

  async function fetchPortfolio() {
    const { data, error } = await supabase.from("portfolio").select("*");
    if (error) console.error("Błąd pobierania:", error);
    else setPortfolio(data || []);
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

  // Przygotowanie danych do naszego "Kuloodpornego Wykresu"
  const backgroundColors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f43f5e",
  ];

  const chartData = (portfolio || [])
    .map((item) => {
      const itemCurrency = item.currency || "PLN";
      const rate = itemCurrency === "USD" ? usdToPln : 1;
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.buy_price) || 0;
      const investedPln = parseFloat((qty * price * rate).toFixed(2));
      return { ...item, investedPln };
    })
    .filter((item) => item.investedPln > 0);

  const totalPortfolioValue = chartData.reduce(
    (sum, item) => sum + item.investedPln,
    0,
  );

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-100 p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Nagłówek */}
        <header className="flex flex-col sm:flex-row justify-between items-center bg-neutral-800 p-6 rounded-xl shadow-lg border border-neutral-700">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Panel Inwestycyjny
            </h1>
            <p className="text-gray-400 mt-1">
              Zainwestowano:{" "}
              <strong className="text-emerald-400">
                {totalPortfolioValue.toFixed(2)} PLN
              </strong>
            </p>
          </div>
          <div className="mt-4 sm:mt-0 text-gray-300 font-semibold bg-neutral-900 px-4 py-2 rounded-lg border border-neutral-700">
            USD/PLN:{" "}
            <span className="text-emerald-400">{usdToPln.toFixed(2)} zł</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolumna Lewa: Formularz i Alokacja */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-neutral-800 p-6 rounded-xl shadow-lg border border-neutral-700">
              <h2 className="text-xl font-semibold mb-4 text-white">
                Dodaj Aktywo
              </h2>
              <form onSubmit={addStock} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Ticker (np. NVDA)"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  required
                  className="p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                <div className="flex gap-4">
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Ilość"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    className="p-3 w-1/2 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Cena"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    required
                    className="p-3 w-1/2 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="PLN">PLN</option>
                  <option value="USD">USD</option>
                </select>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Zapisz do portfela
                </button>
              </form>
            </div>

            {/* Bezawaryjny Wykres Alokacji (Czysty CSS) */}
            {chartData.length > 0 && (
              <div className="bg-neutral-800 p-6 rounded-xl shadow-lg border border-neutral-700 flex flex-col">
                <h3 className="text-lg font-medium text-gray-300 mb-4">
                  Struktura Portfela
                </h3>

                {/* Pasek alokacji */}
                <div className="w-full h-8 bg-neutral-900 rounded-full flex overflow-hidden shadow-inner border border-neutral-700">
                  {chartData.map((data, index) => (
                    <div
                      key={index}
                      style={{
                        width: `${(data.investedPln / totalPortfolioValue) * 100}%`,
                        backgroundColor:
                          backgroundColors[index % backgroundColors.length],
                      }}
                      className="h-full border-r border-neutral-800 last:border-0 hover:opacity-80 transition-opacity cursor-help"
                      title={`${data.ticker}: ${data.investedPln.toFixed(2)} PLN`}
                    ></div>
                  ))}
                </div>

                {/* Legenda */}
                <div className="mt-5 flex flex-wrap gap-3 justify-center">
                  {chartData.map((data, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 text-sm text-gray-300"
                    >
                      <span
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{
                          backgroundColor:
                            backgroundColors[index % backgroundColors.length],
                        }}
                      ></span>
                      <span className="font-medium">{data.ticker}</span>
                      <span className="text-gray-500">
                        (
                        {(
                          (data.investedPln / totalPortfolioValue) *
                          100
                        ).toFixed(1)}
                        %)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Kolumna Prawa: Tabela */}
          <div className="bg-neutral-800 rounded-xl shadow-lg border border-neutral-700 lg:col-span-2 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-neutral-700">
              <h2 className="text-xl font-semibold text-white">
                Posiadane Pozycje
              </h2>
            </div>
            <div className="overflow-x-auto flex-grow p-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-neutral-700">
                    <th className="pb-3 font-medium">Aktywo</th>
                    <th className="pb-3 font-medium text-right">Ilość</th>
                    <th className="pb-3 font-medium text-right">Cena Zakupu</th>
                    <th className="pb-3 font-medium text-right">
                      Wartość (PLN)
                    </th>
                    <th className="pb-3 font-medium text-center">Akcja</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {chartData.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-neutral-700/50 hover:bg-neutral-700/30 transition-colors"
                    >
                      <td className="py-4 font-bold text-blue-400">
                        {item.ticker}
                      </td>
                      <td className="py-4 text-right">{item.quantity}</td>
                      <td className="py-4 text-right text-gray-300">
                        {item.buy_price}{" "}
                        <span className="text-xs text-gray-500">
                          {item.currency || "PLN"}
                        </span>
                      </td>
                      <td className="py-4 text-right font-medium text-emerald-400">
                        {item.investedPln.toFixed(2)} zł
                      </td>
                      <td className="py-4 text-center">
                        <button
                          onClick={() => deleteStock(item.id)}
                          className="text-red-500 hover:text-red-400 hover:underline px-3 py-1 rounded transition-colors font-medium"
                        >
                          Usuń
                        </button>
                      </td>
                    </tr>
                  ))}
                  {chartData.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-8 text-center text-gray-500"
                      >
                        Brak aktywów w portfelu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
