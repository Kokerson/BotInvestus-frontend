import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { Pie } from "react-chartjs-2";

// Rejestracja modułów Chart.js
ChartJS.register(ArcElement, ChartTooltip, Legend);

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

  // Przygotowanie danych do Chart.js
  const chartLabels = [];
  const chartValues = [];
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

  (portfolio || []).forEach((item) => {
    const itemCurrency = item.currency || "PLN";
    const rate = itemCurrency === "USD" ? usdToPln : 1;
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.buy_price) || 0;
    const investedPln = parseFloat((qty * price * rate).toFixed(2));

    if (investedPln > 0) {
      chartLabels.push(item.ticker || "Nieznany");
      chartValues.push(investedPln);
    }
  });

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartValues,
        backgroundColor: backgroundColors.slice(0, chartValues.length),
        borderColor: "#1a1a1a",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: { position: "bottom", labels: { color: "#fff" } },
      tooltip: { callbacks: { label: (context) => ` ${context.raw} PLN` } },
    },
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-100 p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Nagłówek */}
        <header className="flex flex-col sm:flex-row justify-between items-center bg-neutral-800 p-6 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Panel Inwestycyjny
          </h1>
          <div className="mt-4 sm:mt-0 text-emerald-400 font-semibold bg-neutral-900 px-4 py-2 rounded-lg border border-neutral-700">
            USD/PLN: {usdToPln.toFixed(2)} zł
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolumna Lewa: Formularz i Wykres */}
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

            {chartValues.length > 0 && (
              <div className="bg-neutral-800 p-6 rounded-xl shadow-lg border border-neutral-700 flex flex-col items-center">
                <h3 className="text-lg font-medium text-gray-300 mb-4">
                  Struktura Portfela
                </h3>
                <div className="w-64 h-64">
                  <Pie data={chartData} options={chartOptions} />
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
                  {(portfolio || []).map((item) => {
                    const itemCurrency = item.currency || "PLN";
                    const rate = itemCurrency === "USD" ? usdToPln : 1;
                    const qty = parseFloat(item.quantity) || 0;
                    const price = parseFloat(item.buy_price) || 0;
                    const totalValue = (qty * price * rate).toFixed(2);

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-neutral-700/50 hover:bg-neutral-700/30 transition-colors"
                      >
                        <td className="py-4 font-bold text-blue-400">
                          {item.ticker}
                        </td>
                        <td className="py-4 text-right">{qty}</td>
                        <td className="py-4 text-right text-gray-300">
                          {price}{" "}
                          <span className="text-xs text-gray-500">
                            {itemCurrency}
                          </span>
                        </td>
                        <td className="py-4 text-right font-medium text-emerald-400">
                          {totalValue} zł
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
                    );
                  })}
                  {portfolio.length === 0 && (
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
