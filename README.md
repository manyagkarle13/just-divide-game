# 🎮 Just Divide – Kid Mode

A responsive **React.js** implementation of the **Just Divide – Kid Mode** math puzzle game.
The game helps children practice division, factors, and strategic thinking through an interactive drag-and-drop grid system.

This project was built as part of a **Frontend Engineering assignment** focusing on:

* UI accuracy
* Game logic
* Responsiveness
* Clean code structure

---

## 🔗 Live Demo

**Play the game here:**
https://just-dividegame.netlify.app/

---

## 📌 Project Overview

The player drags number tiles into a **4×4 grid**.
Tiles interact based on division rules:

* Equal numbers disappear
* Divisible numbers merge into a quotient
* Results equal to **1** are removed
* Score increases with successful merges
* Game ends when the grid is full and no moves remain

The application is fully responsive and supports:

* Desktop
* Tablet
* Mobile devices

---

## ✨ Features

* 4×4 interactive grid
* Drag-and-drop tile placement
* Equal and divisible tile merge logic
* **KEEP** slot to store a tile
* **TRASH** slot with limited uses
* Score and level tracking
* Undo functionality
* Hint system
* Game timer
* Game over detection
* Best score persistence using **localStorage**
* Responsive UI design

---

## 🛠️ Tech Stack

### Frontend

* React.js
* JavaScript (ES6)
* HTML5
* CSS3
* Vite

### Libraries & Tools

* React Hooks
* React DnD (Drag and Drop)
* Vercel (Deployment)
* Git & GitHub

---

## 🧠 Game Rules

### Equal Tiles Disappear

Example:

4 + 4 → removed

---

### Divisible Tiles Merge

Examples:

12 ÷ 3 → 4
15 ÷ 5 → 3
9 ÷ 3 → 3

---

### Result of 1 is Removed

Example:

2 ÷ 2 → removed

---

## 🏗️ Project Structure

```
just-divide-game/
│
├── public/
│
├── src/
│   │
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   │
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
│
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

## ⚙️ Installation

### Clone the repository

```
git clone https://github.com/manyagkarle13/just-divide-game.git
```

### Navigate into the project

```
cd just-divide-game
```

### Install dependencies

```
npm install
```

### Run the development server

```
npm run dev
```

---

## 🚀 Deployment

The application is deployed using **Vercel**.

To deploy manually:

```
npm run build
```

Then connect the GitHub repository to **Vercel** or upload the build folder.

---

## 🧪 Key Implementation Decisions

* Used **React Hooks** for state management
* Implemented custom merge logic for division rules
* Used **localStorage** to persist best score
* Designed modular component architecture
* Ensured responsive layout across devices
* Optimized performance with efficient state updates

---

## 👩‍💻 Author

**Manya G Karle**

---

## 📄 License

This project is created for educational and assessment purposes.
