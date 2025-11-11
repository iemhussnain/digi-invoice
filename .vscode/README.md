# VS Code Configuration for DigInvoice ERP

## 🚀 F5 se Run Kaise Karein

### Quick Start:

1. **VS Code mein project folder open karein**
2. **F5 press karein**
3. **Dropdown se select karein:**
   - `Next.js: debug full stack` (Recommended - Browser bhi khulega)
   - `Next.js: debug server-side` (Only server run hoga)
   - `Next.js: debug client-side` (Browser debugging)

---

## 🎯 3 Debug Options:

### 1. **Next.js: debug full stack** (Best Option)
- **F5 press → Automatic setup**
- Server start hoga
- Browser automatically khulega
- Server + Client dono debug ho sakte hain
- Breakpoints lagaye server aur client code mein

### 2. **Next.js: debug server-side**
- Only server-side code debug
- API routes mein breakpoints
- Database calls track karein
- Fast startup

### 3. **Next.js: debug client-side**
- Only browser debugging
- Pehle manually `npm run dev` chalayein
- Phir F5 press karein
- React components debug karein

---

## ⚙️ Files Created:

```
.vscode/
├── launch.json        👈 F5 debugging configuration
├── settings.json      👈 VS Code workspace settings
├── tasks.json         👈 Build tasks (npm scripts)
├── extensions.json    👈 Recommended extensions
└── README.md          👈 This file
```

---

## 🔧 Keyboard Shortcuts:

| Shortcut | Action |
|----------|--------|
| **F5** | Start debugging (run project) |
| **Shift+F5** | Stop debugging |
| **Ctrl+Shift+F5** | Restart debugging |
| **F9** | Toggle breakpoint |
| **F10** | Step over |
| **F11** | Step into |
| **Shift+F11** | Step out |
| **Ctrl+\`** | Open terminal |

---

## 📦 Recommended Extensions:

VS Code khulne par ye extensions install karne ka suggestion aayega:

1. **ESLint** - Code linting
2. **Prettier** - Code formatting
3. **Tailwind CSS IntelliSense** - Tailwind class suggestions
4. **MongoDB for VS Code** - Database management
5. **Path Intellisense** - File path autocomplete
6. **Code Spell Checker** - Spelling mistakes catch karein
7. **Error Lens** - Inline error messages

**Install karne ke liye:**
- `Ctrl+Shift+X` press karein (Extensions panel)
- "Install Workspace Recommended Extensions" click karein

---

## 🎨 Auto-Format Settings:

File save karne par automatically format ho jayegi:

- ESLint errors fix hongey
- Prettier formatting apply hogi
- Code consistent rahega

**Manual format:**
- **Shift+Alt+F** (Windows/Linux)
- **Shift+Option+F** (Mac)

---

## 🐛 Debugging Tips:

### Breakpoints Kaise Lagayein:

1. **Line number par click karein** (red dot aayega)
2. **F5 press karein** (debug start)
3. Code us line par pause ho jayega
4. Variables inspect kar sakte hain

### Console Logs Dekhein:

- **Debug Console** (Ctrl+Shift+Y)
- **Terminal** (Ctrl+\`)
- Browser Console (F12)

### Watch Variables:

1. Debug mode mein
2. Left sidebar → "Watch" section
3. Variable name add karein
4. Real-time value dekhein

---

## 🚀 Quick Commands:

### Terminal se (Ctrl+\`):

```bash
# Development server start
npm run dev

# Build production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

### VS Code Command Palette (Ctrl+Shift+P):

```
> Tasks: Run Task
  - dev (start development server)
  - build (build for production)
  - start (production server)
  - lint (check code)
```

---

## 🔍 Search & Navigation:

| Shortcut | Action |
|----------|--------|
| **Ctrl+P** | Quick file open |
| **Ctrl+Shift+F** | Search in all files |
| **Ctrl+T** | Go to symbol |
| **F12** | Go to definition |
| **Alt+F12** | Peek definition |
| **Shift+F12** | Find all references |

---

## 📁 Folder Structure:

```
digi-invoice/
├── .vscode/              👈 VS Code configuration
│   ├── launch.json
│   ├── settings.json
│   ├── tasks.json
│   └── extensions.json
├── src/
│   ├── app/
│   ├── lib/
│   ├── models/
│   ├── middleware/
│   └── utils/
├── .env.local            👈 Environment variables
├── package.json
└── README.md
```

---

## ✅ Setup Verification:

### Test karein:

1. **Open VS Code** in project folder
2. **Press F5**
3. Select "Next.js: debug full stack"
4. Check:
   - [ ] Server start ho gaya
   - [ ] Terminal mein "Ready" dikha
   - [ ] Browser automatically khula
   - [ ] http://localhost:3000 accessible hai

---

## 🆘 Troubleshooting:

### Issue: F5 press karne par kuch nahi hota

**Solution:**
1. `Ctrl+Shift+P` → "Reload Window"
2. VS Code restart karein
3. Check `.vscode/launch.json` exists

### Issue: Browser nahi khulta

**Solution:**
1. "Next.js: debug server-side" select karein
2. Manually browser mein jaayein: http://localhost:3000

### Issue: Breakpoints hit nahi ho rahe

**Solution:**
1. Source map enabled hai check karein
2. File save karein (Ctrl+S)
3. Debug restart karein (Ctrl+Shift+F5)

### Issue: Port 3000 already in use

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# Mac/Linux
lsof -i :3000
kill -9 [PID]
```

---

## 🎉 All Set!

Ab aap **F5 press karke** directly development server run kar sakte hain!

**Happy Coding! 🚀**
