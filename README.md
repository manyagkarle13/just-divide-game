Just Divide – Kid Mode 🎮

A responsive ReactJS implementation of the Just Divide – Kid Mode math puzzle game.
The game helps children practice division, factors, and strategic thinking through an interactive drag-and-drop grid system.

This project was built as part of a frontend engineering assignment focusing on UI accuracy, game logic, responsiveness, and clean code structure.

---

🔗 Live Demo

Deployed Application:
https://just-divide-game-deu27ujm1-manyagkarle13s-projects.vercel.app/

---

📌 Project Overview

The player drags number tiles into a 4×4 grid.
Tiles interact based on division rules:

- Equal numbers disappear
- Divisible numbers merge into a quotient
- Results equal to 1 are removed
- Score increases with successful merges
- Game ends when the grid is full and no moves remain

The application is fully responsive and supports desktop, tablet, and mobile devices.

---

✨ Features

- 4×4 interactive grid
- Drag-and-drop tile placement
- Equal and divisible tile merge logic
- KEEP slot to store a tile
- TRASH slot with limited uses
- Score and level tracking
- Undo functionality
- Hint system
- Game timer
- Game over detection
- Best score persistence using localStorage
- Responsive UI design

---

🛠️ Tech Stack

Frontend

- ReactJS
- JavaScript (ES6)
- HTML5
- CSS3

Libraries

- React Hooks
- React DnD (Drag and Drop)
- Vercel (Deployment)

---

🧠 Game Rules

1. Equal Tiles Disappear

Example:

4 + 4 → removed

---

2. Divisible Tiles Merge

Examples:

12 ÷ 3 → 4
15 ÷ 5 → 3
9 ÷ 3 → 3

---

3. Result of 1 is Removed

Example:

2 ÷ 2 → removed

---

🏗️ Project Structure

just-divide-game/
│── public/
│── src/
│   │── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   │
│   │── App.jsx
│   │── App.css
│   │── index.css
│   │── main.jsx
│
│── index.html
│── package.json
│── package-lock.json
│── vite.config.js
│── README.md
---

⚙️ Installation

Clone the repository:

git clone https://github.com/your-username/just-divide-game.git

Navigate into the project:

cd just-divide-game

Install dependencies:

npm install

Run the development server:

npm start

---

🚀 Deployment

The application is deployed using Vercel.

To deploy:

npm run build

Then upload the build folder to Vercel or connect the GitHub repository.

---

🧪 Key Implementation Decisions

- Used React Hooks for state management
- Implemented custom merge logic for game rules
- Used localStorage to persist best score
- Designed modular component architecture
- Ensured responsive layout across devices
- Optimized performance with lightweight state updates

---


👩‍💻 Author

Manya G Karle

---

📄 License

This project is created for educational and assessment purposes.
