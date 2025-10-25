
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>✈️ FlyWithObed Live Aviator Dashboard</title>
  <style>
    body {
      background: #0b0f19;
      color: #f1f1f1;
      font-family: 'Poppins', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin: 0;
      padding: 20px;
    }

    h1 {
      font-size: 24px;
      margin-bottom: 5px;
    }

    .plane {
      font-size: 48px;
      margin: 10px 0;
    }

    .multiplier {
      font-size: 36px;
      color: #00ff90;
    }

    .players {
      display: flex;
      justify-content: space-around;
      width: 90%;
      margin-top: 20px;
    }

    .player {
      background: #131b2b;
      padding: 20px;
      border-radius: 12px;
      width: 40%;
    }

    input {
      width: 60%;
      padding: 8px;
      border: none;
      border-radius: 6px;
      margin-bottom: 10px;
      font-size: 16px;
    }

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      background: #00aaff;
      color: white;
      cursor: pointer;
      font-size: 16px;
      margin: 5px;
    }

    button:hover {
      background: #0077cc;
    }

    table {
      width: 90%;
      margin-top: 20px;
      border-collapse: collapse;
      color: #fff;
    }

    th, td {
      border: 1px solid #444;
      padding: 6px 10px;
    }

    th {
      background: #1b2233;
    }

    .status {
      margin-top: 10px;
      color: #ccc;
    }
  </style>
</head>
<body>
  <h1>✈️ FlyWithObed Live Aviator Dashboard</h1>
  <div class="plane">🛩️</div>
  <div class="multiplier" id="multiplier">1.00x</div>
  <div class="status" id="status">Connecting to live server...</div>

  <div class="players">
    <div class="player" id="playerA">
      <h3>👨‍✈️ Player A</h3>
      <p>Balance: $<span id="balanceA">1000</span></p>
      <input type="number" id="betA" placeholder="Enter bet..." />
      <br />
      <button onclick="placeBet('A')">Bet</button>
      <button onclick="cashout('A')">Cashout</button>
      <p id="resultA"></p>
    </div>

    <div class="player" id="playerB">
      <h3>🧑‍✈️ Player B</h3>
      <p>Balance: $<span id="balanceB">1000</span></p>
      <input type="number" id="betB" placeholder="Enter bet..." />
      <br />
      <button onclick="placeBet('B')">Bet</button>
      <button onclick="cashout('B')">Cashout</button>
      <p id="resultB"></p>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Round</th><th>Crash Point</th></tr>
    </thead>
    <tbody id="history"></tbody>
  </table>

  <script>
    const socket = new WebSocket("wss://flywithobed-livebet.onrender.com");
    const multiplierEl = document.getElementById("multiplier");
    const statusEl = document.getElementById("status");
    const historyEl = document.getElementById("history");

    let balanceA = 1000, balanceB = 1000;
    let currentMultiplier = 1.00;
    let activeBetA = null, activeBetB = null;

    socket.onopen = () => {
      statusEl.textContent = "🟢 Connected to live Aviator server!";
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.multiplier) {
        currentMultiplier = data.multiplier;
        multiplierEl.textContent = data.multiplier.toFixed(2) + "x";
      }

      if (data.crashPoint) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${data.round}</td><td>${data.crashPoint.toFixed(2)}x</td>`;
        historyEl.prepend(row);

        // Resolve active bets
        endRound(data.crashPoint);
      }
    };

    function placeBet(player) {
      const betInput = document.getElementById("bet" + player);
      const betAmount = parseFloat(betInput.value);
      if (!betAmount || betAmount <= 0) return alert("Enter a valid bet!");

      if (player === "A" && !activeBetA && balanceA >= betAmount) {
        balanceA -= betAmount;
        activeBetA = { amount: betAmount, start: currentMultiplier };
        document.getElementById("balanceA").textContent = balanceA.toFixed(2);
        document.getElementById("resultA").textContent = `Bet $${betAmount}`;
      }

      if (player === "B" && !activeBetB && balanceB >= betAmount) {
        balanceB -= betAmount;
        activeBetB = { amount: betAmount, start: currentMultiplier };
        document.getElementById("balanceB").textContent = balanceB.toFixed(2);
        document.getElementById("resultB").textContent = `Bet $${betAmount}`;
      }
    }

    function cashout(player) {
      if (player === "A" && activeBetA) {
        const profit = activeBetA.amount * currentMultiplier;
        balanceA += profit;
        activeBetA = null;
        document.getElementById("balanceA").textContent = balanceA.toFixed(2);
        document.getElementById("resultA").textContent = `💰 Cashed out at ${currentMultiplier.toFixed(2)}x`;
      }

      if (player === "B" && activeBetB) {
        const profit = activeBetB.amount * currentMultiplier;
        balanceB += profit;
        activeBetB = null;
        document.getElementById("balanceB").textContent = balanceB.toFixed(2);
        document.getElementById("resultB").textContent = `💰 Cashed out at ${currentMultiplier.toFixed(2)}x`;
      }
    }

    function endRound(crashPoint) {
      if (activeBetA) {
        if (currentMultiplier < crashPoint) {
          // Lost
          document.getElementById("resultA").textContent = `💥 Lost at ${crashPoint.toFixed(2)}x`;
        }
        activeBetA = null;
      }

      if (activeBetB) {
        if (currentMultiplier < crashPoint) {
          document.getElementById("resultB").textContent = `💥 Lost at ${crashPoint.toFixed(2)}x`;
        }
        activeBetB = null;
      }
    }
  </script>
</body>
</html>
