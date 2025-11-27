<details> 

# 📔 MyDiary.write – A Personal Digital Journal

**MyDiary.write** is a secure and expressive full-stack journaling application that allows users to write, store, and explore personal and public posts — all while maintaining privacy. With a clean UI, emoji support, image uploads, and user authentication, MyDiary blends simplicity and functionality for modern diary-keeping.

---

## 🌟 Features

- 📝 Create private and public (anonymous) diary entries  
- 🔐 Secure user registration, login, and password reset  
- 🖼️ Attach a single image to a post  




- 😊 Emoji support in post content and reactions  
- 💬 React to posts with: Like, Love, Laugh, Sad  
- 🧭 View global feed (anonymous), private posts, and post details  
- 🌗 Dark mode toggle and UI enhancements  
- 📧 Password reset via Gmail  

---

## 🧰 Tech Stack

**Frontend**  
- HTML, CSS (Bootstrap), JavaScript  
- Served statically from Express `public/` folder

**Backend**  
- Node.js with Express.js  
- MySQL database  
- bcrypt for password hashing  
- multer for image upload  
- nodemailer for email integration

---

## 📁 Folder Structure

```
MyDiary/
└── backend/
    ├── public/              # Frontend HTML, CSS, JS
    │   ├── Login.html
    │   ├── Registration.html
    │   ├── FeedPage.html
    │   └── ...
    ├── server.js
    ├── routes/
    ├── utils/
    ├── uploads/
    └── .env                 # Not committed
```

---

## 🚀 Getting Started

### 🔧 Prerequisites

- Node.js (v16+)
- MySQL installed and running

### 🔐 Environment Variables

Create a `.env` file in `backend/`:

```env
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=yourpassword
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourdbpassword
DB_NAME=mydiary
```

---

### 📦 Install Dependencies

```bash
cd backend
npm install
```

---

### ▶️ Run the Server

```bash
node server.js
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---



## 📸 Screenshots and Demo Video

Login page
<img width="1910" height="880" alt="image" src="https://github.com/user-attachments/assets/68e71cef-9c68-418e-a8d8-458345324487" />
Global Feedpage
<img width="1848" height="875" alt="image" src="https://github.com/user-attachments/assets/c10dcd8f-ca7a-4ff0-b7c2-eadf139d50a4" />
Post page
<img width="1894" height="866" alt="image" src="https://github.com/user-attachments/assets/07f2b6d3-dd46-4cfe-8711-28d10f7aa304" />

Demo Video

https://github.com/user-attachments/assets/4c231636-94f7-436e-8f92-c3f964cb112a



## 🧑‍💻 Author

**Manusri D**  
GitHub: [@manusrid8](https://github.com/manusrid8)

---

</details>
