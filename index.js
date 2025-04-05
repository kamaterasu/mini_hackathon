const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

let timer = 0; // current timer in seconds
let initialTime = 0; // initial timer value in seconds
let interval;
let running = false;

// Serve static files from the 'public' folder
app.use(express.static(__dirname + "/public"));

io.on("connection", (socket) => {
  console.log("A user connected");

  // Send current state to the new connection
  socket.emit("timerUpdate", { timer, running });

  // Set initial time based on minutes input
  socket.on("setInitialTime", (data) => {
    // Convert minutes to seconds
    initialTime = parseInt(data.minutes, 10) * 60;
    timer = initialTime;
    running = false;
    clearInterval(interval);
    io.emit("timerUpdate", { timer, running });
  });

  // Start countdown timer
  socket.on("startTimer", () => {
    if (!running && timer > 0) {
      running = true;
      interval = setInterval(() => {
        if (timer > 0) {
          timer--;
          io.emit("timerUpdate", { timer, running });
        } else {
          running = false;
          clearInterval(interval);
          io.emit("timerUpdate", { timer, running });
        }
      }, 1000);
    }
  });

  // Pause timer
  socket.on("pauseTimer", () => {
    running = false;
    clearInterval(interval);
    io.emit("timerUpdate", { timer, running });
  });

  // Stop timer: reset to initial value
  socket.on("stopTimer", () => {
    running = false;
    clearInterval(interval);
    timer = initialTime;
    io.emit("timerUpdate", { timer, running });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
