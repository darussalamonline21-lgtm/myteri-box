# 📚 TECHNICAL DOCUMENTATION INDEX

**Project**: Mystery Box Campaign Application  
**Version**: 1.0  
**Last Updated**: 2025-11-25  
**Prepared by**: Senior Software Architect  

---

## 🎯 WELCOME TO THE TECHNICAL DOCUMENTATION

Dokumentasi ini dibuat untuk membantu **kontributor baru** memahami arsitektur, alur data, dan hubungan antar-file dalam project Mystery Box Campaign Application.

Sebagai **Senior Software Architect**, saya telah melakukan **Code Review mendalam** dan membuat dokumentasi teknis tingkat rendah (low-level) yang menjelaskan **"Wiring"** atau hubungan antar-file dalam project ini.

---

## 📖 DOCUMENTATION STRUCTURE

Dokumentasi ini terdiri dari **4 file utama** yang saling melengkapi:

### 1️⃣ **TECHNICAL_DOCUMENTATION_MASTER.md** 
📘 **[BACA DI SINI](./TECHNICAL_DOCUMENTATION_MASTER.md)**

**Isi:**
- Project overview & architecture
- Complete file dependency map
- Routing & middleware flow
- Database schema overview
- API endpoints reference
- Authentication & authorization
- Error handling strategy
- Performance optimizations

**Untuk Siapa:**
- Kontributor baru yang ingin memahami big picture
- Developer yang perlu referensi cepat tentang struktur project
- Architect yang ingin review keseluruhan sistem

**Estimasi Waktu Baca:** 20-30 menit

---

### 2️⃣ **TECHNICAL_DOCUMENTATION_LOGIN_FLOW.md**
🔐 **[BACA DI SINI](./TECHNICAL_DOCUMENTATION_LOGIN_FLOW.md)**

**Isi:**
- File dependency map untuk login flow
- Step-by-step execution flow (25+ steps)
- Mermaid sequence diagram
- JWT token management
- Session handling
- Security considerations
- Error scenarios

**Untuk Siapa:**
- Developer yang akan modify authentication
- Security reviewer
- Developer yang debug login issues

**Estimasi Waktu Baca:** 15-20 menit

**Key Topics:**
- JWT generation & verification
- bcrypt password hashing
- localStorage management
- Auto-logout mechanism
- Token expiration handling

---

### 3️⃣ **TECHNICAL_DOCUMENTATION_BOX_OPENING_FLOW.md**
🎁 **[BACA DI SINI](./TECHNICAL_DOCUMENTATION_BOX_OPENING_FLOW.md)**

**Isi:**
- File dependency map untuk box opening
- Step-by-step execution flow (44+ steps)
- Mermaid sequence diagram
- Prize selection algorithm
- Race condition prevention
- Database transaction management
- Real-time sync mechanism
- Performance optimizations

**Untuk Siapa:**
- Developer yang akan modify core gameplay
- Developer yang debug box opening issues
- Developer yang ingin understand prize algorithm

**Estimasi Waktu Baca:** 25-35 menit

**Key Topics:**
- Prisma transactions
- Optimistic locking
- Dynamic probability algorithm
- Weighted random selection
- Concurrent user handling
- Optimistic UI updates
- Background polling

---

### 4️⃣ **IMPORT_DEPENDENCY_GRAPH.md**
🕸️ **[BACA DI SINI](./IMPORT_DEPENDENCY_GRAPH.md)**

**Isi:**
- Complete visual import graph (Mermaid)
- Frontend dependency chains
- Backend dependency chains
- Dependency depth analysis
- Most imported files
- Circular dependency check
- Import patterns & best practices
- Refactoring opportunities

**Untuk Siapa:**
- Developer yang ingin understand file relationships
- Architect yang review code structure
- Developer yang melakukan refactoring

**Estimasi Waktu Baca:** 15-20 menit

**Key Topics:**
- Import/export patterns
- Module coupling analysis
- Dependency statistics
- Critical import paths

---

### 5️⃣ **QUICK_REFERENCE_GUIDE.md**
⚡ **[BACA DI SINI](./QUICK_REFERENCE_GUIDE.md)**

**Isi:**
- "I want to..." task-based guide
- Code examples untuk common tasks
- Debugging tips & tricks
- Useful commands
- Common issues & solutions
- Testing checklist
- Pro tips

**Untuk Siapa:**
- Developer yang butuh quick answer
- Developer yang stuck pada specific task
- Developer yang perlu code snippet

**Estimasi Waktu Baca:** 5-10 menit (lookup reference)

**Key Topics:**
- Add new endpoint
- Add new component
- Handle forms
- Query database
- Debug API calls
- Add animations
- Common errors

---

## 🗺️ LEARNING PATH

### 🎯 Path 1: Quick Start (1-2 hours)

**Goal**: Understand basic structure dan bisa mulai coding

1. Read **TECHNICAL_DOCUMENTATION_MASTER.md** (Section 1-3)
   - Project overview
   - Architecture
   - File structure

2. Skim **IMPORT_DEPENDENCY_GRAPH.md**
   - Lihat visual graph
   - Pahami high-level relationships

3. Bookmark **QUICK_REFERENCE_GUIDE.md**
   - Untuk lookup saat coding

4. Run the application
   - Follow setup instructions
   - Explore UI
   - Test features

**Output**: Anda bisa navigate codebase dan mulai small tasks

---

### 🎯 Path 2: Deep Dive (4-6 hours)

**Goal**: Understand core features secara mendalam

1. Read **TECHNICAL_DOCUMENTATION_LOGIN_FLOW.md** (Complete)
   - Understand authentication
   - Trace code execution
   - Study sequence diagram

2. Read **TECHNICAL_DOCUMENTATION_BOX_OPENING_FLOW.md** (Complete)
   - Understand core gameplay
   - Study prize algorithm
   - Understand transactions

3. Read **TECHNICAL_DOCUMENTATION_MASTER.md** (Section 4-10)
   - Routing details
   - Database schema
   - API reference
   - Error handling
   - Performance

4. Study actual code files
   - Open files mentioned in docs
   - Follow import chains
   - Add console.logs and test

**Output**: Anda bisa modify existing features dengan confidence

---

### 🎯 Path 3: Expert Level (8-12 hours)

**Goal**: Master seluruh codebase dan bisa lead development

1. Complete Path 1 & 2

2. Study **IMPORT_DEPENDENCY_GRAPH.md** (Complete)
   - Understand all dependencies
   - Identify coupling points
   - Plan refactoring

3. Read all source code files
   - Controllers
   - Services
   - Components
   - Middlewares

4. Study database schema
   - Open Prisma Studio
   - Understand relationships
   - Review migrations

5. Test edge cases
   - Concurrent users
   - Race conditions
   - Error scenarios

6. Review performance
   - Check query efficiency
   - Optimize slow operations
   - Add indexes if needed

**Output**: Anda bisa architect new features dan review code

---

## 📋 DOCUMENTATION USAGE GUIDE

### Scenario 1: "Saya baru join project, mulai dari mana?"

**Answer:**
1. Read **TECHNICAL_DOCUMENTATION_MASTER.md** (Section 1-2)
2. Setup development environment
3. Run application dan explore
4. Follow **Learning Path 1**

---

### Scenario 2: "User report bug: box tidak bisa dibuka"

**Answer:**
1. Open **TECHNICAL_DOCUMENTATION_BOX_OPENING_FLOW.md**
2. Go to Section 2 (Detailed Execution Flow)
3. Follow step-by-step untuk identify dimana error terjadi
4. Check Section 6 (Error Handling Matrix)
5. Use **QUICK_REFERENCE_GUIDE.md** untuk debugging tips

---

### Scenario 3: "Saya mau add fitur baru: leaderboard"

**Answer:**
1. Read **TECHNICAL_DOCUMENTATION_MASTER.md** (Section 3-4)
   - Understand file structure
   - Understand routing pattern
2. Use **QUICK_REFERENCE_GUIDE.md**
   - "Add a New API Endpoint"
   - "Add a New React Component"
   - "Query Database with Prisma"
3. Follow existing patterns dari similar features
4. Update documentation setelah selesai

---

### Scenario 4: "Saya mau refactor code, apa yang harus diperhatikan?"

**Answer:**
1. Read **IMPORT_DEPENDENCY_GRAPH.md**
   - Identify files yang akan terpengaruh
   - Check dependency depth
   - Look for circular dependencies
2. Read **TECHNICAL_DOCUMENTATION_MASTER.md** (Section 10)
   - Performance considerations
   - Best practices
3. Create backup branch
4. Refactor incrementally
5. Test thoroughly
6. Update documentation

---

### Scenario 5: "Saya perlu explain code ke stakeholder non-technical"

**Answer:**
1. Use **Mermaid diagrams** dari dokumentasi
   - Visual lebih mudah dipahami
   - Show sequence diagrams
2. Use **Data Flow Summary** sections
   - High-level overview
   - No technical jargon
3. Focus on **business value**
   - What problem it solves
   - How it benefits users

---

## 🎨 DOCUMENTATION FEATURES

### ✨ What Makes This Documentation Special:

1. **Low-Level Technical Details**
   - Line-by-line code execution
   - Exact function names
   - Exact file paths
   - Variable names

2. **Visual Diagrams**
   - Mermaid sequence diagrams
   - Dependency graphs
   - Architecture diagrams
   - Data flow charts

3. **Practical Examples**
   - Real code snippets
   - Actual file content
   - Working examples

4. **Comprehensive Coverage**
   - Frontend + Backend
   - Database + API
   - Security + Performance
   - Errors + Edge cases

5. **Contributor-Focused**
   - Learning paths
   - Common issues
   - Best practices
   - Testing checklists

---

## 📊 DOCUMENTATION METRICS

| Document | Pages | Diagrams | Code Examples | Complexity |
|----------|-------|----------|---------------|------------|
| MASTER | ~15 | 3 | 20+ | High |
| LOGIN_FLOW | ~12 | 2 | 15+ | Medium |
| BOX_OPENING_FLOW | ~18 | 2 | 25+ | High |
| IMPORT_GRAPH | ~10 | 2 | 10+ | Medium |
| QUICK_REFERENCE | ~12 | 1 | 30+ | Low |
| **TOTAL** | **~67** | **10** | **100+** | - |

---

## 🔄 KEEPING DOCUMENTATION UPDATED

### When to Update:

✅ **MUST UPDATE:**
- Adding new feature
- Changing API endpoints
- Modifying database schema
- Changing authentication flow
- Refactoring major components

⚠️ **SHOULD UPDATE:**
- Adding new dependency
- Changing error handling
- Performance optimizations
- Security improvements

ℹ️ **OPTIONAL:**
- Minor bug fixes
- UI tweaks
- Code formatting

### How to Update:

1. **Identify affected documentation**
   - Which flow is changed?
   - Which files are modified?

2. **Update relevant sections**
   - File dependency map
   - Execution flow
   - Sequence diagrams
   - Code examples

3. **Update version & date**
   - Top of each file
   - This index file

4. **Review for consistency**
   - Cross-reference between docs
   - Ensure diagrams match code

---

## 🤝 CONTRIBUTING TO DOCUMENTATION

### Documentation Style Guide:

**✅ DO:**
- Use clear, concise language
- Include code examples
- Use diagrams for complex flows
- Explain WHY, not just WHAT
- Include line numbers when referencing code
- Use emoji for visual hierarchy (sparingly)
- Format code blocks with language tags

**❌ DON'T:**
- Use vague terms like "somewhere" or "somehow"
- Skip error scenarios
- Assume prior knowledge
- Use outdated information
- Copy-paste without verification

### Markdown Formatting:

```markdown
# H1 for main title
## H2 for major sections
### H3 for subsections

**Bold** for emphasis
*Italic* for terms
`code` for inline code
```code blocks``` for multi-line

- Bullet lists for items
1. Numbered lists for steps

| Tables | For | Structured | Data |
|--------|-----|------------|------|

[Links](./file.md) for references
```

---

## 📞 SUPPORT & CONTACT

### Need Help?

1. **Check documentation first**
   - Use Ctrl+F to search
   - Check Quick Reference Guide

2. **Search existing issues**
   - GitHub Issues
   - Project wiki

3. **Ask the team**
   - Slack channel
   - Team meeting
   - Code review

### Found an Issue in Documentation?

1. Create GitHub issue with label `documentation`
2. Specify which file and section
3. Suggest correction
4. Submit PR if you can fix it

---

## 🏆 DOCUMENTATION GOALS

### ✅ Achieved:

- [x] Complete file dependency mapping
- [x] Step-by-step execution flows
- [x] Visual sequence diagrams
- [x] Security & performance documentation
- [x] Error handling documentation
- [x] Quick reference guide
- [x] Learning paths for contributors

### 🎯 Future Enhancements:

- [ ] Video walkthroughs
- [ ] Interactive diagrams
- [ ] API playground
- [ ] Automated documentation generation
- [ ] Test coverage documentation
- [ ] Deployment guide
- [ ] Troubleshooting flowcharts

---

## 📁 DOCUMENTATION FILES

```
MISTERI BOX - Copy/
│
├── 📘 TECHNICAL_DOCUMENTATION_INDEX.md (THIS FILE)
│   └── Entry point untuk semua dokumentasi
│
├── 📗 TECHNICAL_DOCUMENTATION_MASTER.md
│   └── Overview lengkap project & architecture
│
├── 📙 TECHNICAL_DOCUMENTATION_LOGIN_FLOW.md
│   └── Detail flow authentication & JWT
│
├── 📕 TECHNICAL_DOCUMENTATION_BOX_OPENING_FLOW.md
│   └── Detail flow core gameplay & prize algorithm
│
├── 🕸️ IMPORT_DEPENDENCY_GRAPH.md
│   └── Visual graph hubungan import antar-file
│
└── ⚡ QUICK_REFERENCE_GUIDE.md
    └── Practical guide & code examples
```

---

## 🚀 GETTING STARTED

### For New Contributors:

**Day 1: Setup & Exploration**
1. Clone repository
2. Setup development environment
3. Read TECHNICAL_DOCUMENTATION_MASTER.md (Section 1-3)
4. Run application
5. Explore UI and test features

**Day 2: Deep Dive**
1. Read TECHNICAL_DOCUMENTATION_LOGIN_FLOW.md
2. Read TECHNICAL_DOCUMENTATION_BOX_OPENING_FLOW.md
3. Follow code execution dengan debugger
4. Make small test changes

**Day 3: Hands-On**
1. Pick a small task from backlog
2. Use QUICK_REFERENCE_GUIDE.md as reference
3. Implement changes
4. Test thoroughly
5. Submit PR

**Week 2+: Advanced**
1. Read IMPORT_DEPENDENCY_GRAPH.md
2. Study all source files
3. Understand database schema
4. Review performance optimizations
5. Start taking larger tasks

---

## 🎓 RECOMMENDED READING ORDER

### For Frontend Developers:

1. TECHNICAL_DOCUMENTATION_MASTER.md (Section 1-3)
2. IMPORT_DEPENDENCY_GRAPH.md (Frontend section)
3. TECHNICAL_DOCUMENTATION_LOGIN_FLOW.md (Frontend parts)
4. TECHNICAL_DOCUMENTATION_BOX_OPENING_FLOW.md (Frontend parts)
5. QUICK_REFERENCE_GUIDE.md (React sections)

### For Backend Developers:

1. TECHNICAL_DOCUMENTATION_MASTER.md (Section 1-4, 6-9)
2. IMPORT_DEPENDENCY_GRAPH.md (Backend section)
3. TECHNICAL_DOCUMENTATION_LOGIN_FLOW.md (Backend parts)
4. TECHNICAL_DOCUMENTATION_BOX_OPENING_FLOW.md (Backend parts)
5. QUICK_REFERENCE_GUIDE.md (Prisma, Express sections)

### For Full-Stack Developers:

1. TECHNICAL_DOCUMENTATION_MASTER.md (Complete)
2. TECHNICAL_DOCUMENTATION_LOGIN_FLOW.md (Complete)
3. TECHNICAL_DOCUMENTATION_BOX_OPENING_FLOW.md (Complete)
4. IMPORT_DEPENDENCY_GRAPH.md (Complete)
5. QUICK_REFERENCE_GUIDE.md (As needed)

### For Architects/Reviewers:

1. TECHNICAL_DOCUMENTATION_MASTER.md (Complete)
2. IMPORT_DEPENDENCY_GRAPH.md (Complete)
3. TECHNICAL_DOCUMENTATION_BOX_OPENING_FLOW.md (Section 4-7)
4. Review actual source code

---

## 📊 DOCUMENTATION COVERAGE

### Features Documented:

| Feature | Coverage | Documentation File |
|---------|----------|-------------------|
| Login Flow | ✅ Complete | LOGIN_FLOW.md |
| Box Opening Flow | ✅ Complete | BOX_OPENING_FLOW.md |
| Campaign Management | 🟡 Partial | MASTER.md |
| Prize Management | 🟡 Partial | MASTER.md |
| User Management | 🟡 Partial | MASTER.md |
| Admin Authentication | 🟡 Partial | MASTER.md |
| File Upload | 🟡 Partial | QUICK_REFERENCE.md |
| CSV Import | ⚪ Not yet | - |
| Data Export | ⚪ Not yet | - |
| Achievement System | ⚪ Not yet | - |

**Legend:**
- ✅ Complete: Detailed step-by-step flow
- 🟡 Partial: Mentioned but not detailed
- ⚪ Not yet: Not documented

---

## 🔍 HOW TO SEARCH

### Finding Specific Information:

**Method 1: Use Ctrl+F in VS Code**
1. Open documentation folder
2. Press `Ctrl + Shift + F` (Search in files)
3. Type keyword (e.g., "JWT", "transaction", "apiClient")
4. Browse results

**Method 2: Use This Index**
1. Scan "Documentation Files" section
2. Identify relevant file
3. Open and read specific section

**Method 3: Follow Cross-References**
- Documentation files link to each other
- Click links to navigate
- Use browser back button to return

---

## 🎯 QUICK LOOKUP

### "Where is the code for...?"

| What | File | Line/Section |
|------|------|--------------|
| User login logic | `backend/src/controllers/authController.js` | Line 10-56 |
| Box opening logic | `backend/src/services/boxService.js` | Line 13-182 |
| Prize selection algorithm | `backend/src/services/boxService.js` | Line 48-102 |
| JWT verification | `backend/src/middlewares/authMiddleware.js` | Line 8-40 |
| Dashboard UI | `frontend/src/pages/DashboardPage.jsx` | Line 62-689 |
| Box component | `frontend/src/components/MysteryBox.jsx` | Line 4-110 |
| API client setup | `frontend/src/services/apiClient.js` | Line 7-64 |
| Database schema | `backend/prisma/schema.prisma` | Entire file |

### "How do I...?"

| Task | Reference |
|------|-----------|
| Add new endpoint | QUICK_REFERENCE.md → "Add a New API Endpoint" |
| Add new component | QUICK_REFERENCE.md → "Add a New React Component" |
| Query database | QUICK_REFERENCE.md → "Query Database with Prisma" |
| Handle errors | MASTER.md → Section 9 |
| Debug API call | QUICK_REFERENCE.md → "Debug API Call" |
| Add authentication | QUICK_REFERENCE.md → "Add Authentication to New Route" |
| Handle file upload | QUICK_REFERENCE.md → "Handle File Uploads" |
| Add animation | QUICK_REFERENCE.md → "Add Framer Motion Animation" |

### "Why is...?"

| Question | Reference |
|----------|-----------|
| Why use transactions? | BOX_OPENING_FLOW.md → Section 4 (Race Condition Prevention) |
| Why optimistic updates? | BOX_OPENING_FLOW.md → Section 4 (State Management) |
| Why JWT? | LOGIN_FLOW.md → Section 4 (Security Mechanisms) |
| Why polling? | BOX_OPENING_FLOW.md → Section 4 (State Management) |
| Why bcrypt? | LOGIN_FLOW.md → Section 4 (Security Mechanisms) |

---

## 🎨 VISUAL DOCUMENTATION MAP

```
┌─────────────────────────────────────────────────────────────┐
│                   📚 DOCUMENTATION INDEX                     │
│                      (You are here)                          │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─────────────────────────────────────────────────┐
             │                                                 │
             ▼                                                 ▼
┌────────────────────────┐                    ┌────────────────────────┐
│   📘 MASTER DOC        │                    │  ⚡ QUICK REFERENCE    │
│   - Architecture       │                    │  - Code Examples       │
│   - API Reference      │                    │  - Common Tasks        │
│   - Database Schema    │                    │  - Debugging Tips      │
└────────────┬───────────┘                    └────────────────────────┘
             │
             ├──────────────────┬──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 🔐 LOGIN FLOW    │  │ 🎁 BOX OPENING   │  │ 🕸️ IMPORT GRAPH  │
│ - Auth Process   │  │ - Core Gameplay  │  │ - Dependencies   │
│ - JWT Details    │  │ - Prize Algo     │  │ - File Relations │
│ - Session Mgmt   │  │ - Transactions   │  │ - Coupling       │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 📝 DOCUMENTATION CONVENTIONS

### File Naming:
- `TECHNICAL_DOCUMENTATION_*.md` - Technical deep-dive
- `*_FLOW.md` - Feature-specific flow
- `*_GUIDE.md` - Practical how-to
- `*_REFERENCE.md` - Quick lookup
- `*_INDEX.md` - Navigation/overview

### Section Numbering:
- **1️⃣ 2️⃣ 3️⃣** - Major sections
- **🔹** - Sub-sections
- **Step 1, Step 2** - Sequential steps

### Code Formatting:
```javascript
// Always include:
// 1. File path in comment
// 2. Line numbers if referencing existing code
// 3. Language tag in code block

// Example:
// File: backend/src/services/boxService.js
// Line: 13-20
export const openBoxForUser = async (userId, campaignId, boxId) => {
  // ... implementation
};
```

### Diagram Formatting:
- Use Mermaid for sequence diagrams
- Use ASCII art for simple trees
- Use tables for comparisons
- Use color coding for clarity

---

## 🎯 DOCUMENTATION QUALITY CHECKLIST

Before considering documentation complete:

- [ ] All major features documented
- [ ] All API endpoints documented
- [ ] All database tables explained
- [ ] All import relationships mapped
- [ ] Sequence diagrams accurate
- [ ] Code examples tested
- [ ] Error scenarios covered
- [ ] Security considerations noted
- [ ] Performance tips included
- [ ] Common issues documented
- [ ] Learning paths defined
- [ ] Cross-references working
- [ ] No broken links
- [ ] Consistent formatting
- [ ] Up-to-date with latest code

---

## 🌟 SPECIAL THANKS

Dokumentasi ini dibuat dengan tujuan untuk:
- ✅ Memudahkan onboarding kontributor baru
- ✅ Mengurangi waktu yang dibutuhkan untuk memahami codebase
- ✅ Mencegah bugs dengan dokumentasi yang jelas
- ✅ Meningkatkan kualitas code review
- ✅ Memfasilitasi knowledge transfer

**Target Audience:**
- Junior developers (learning)
- Mid-level developers (contributing)
- Senior developers (reviewing)
- Architects (planning)
- Stakeholders (understanding)

---

## 📖 FINAL WORDS

> "Good code is self-documenting, but great code has great documentation."

Dokumentasi ini adalah **living document** - akan terus berkembang seiring project berkembang. Jangan ragu untuk:
- Bertanya jika ada yang tidak jelas
- Suggest improvements
- Contribute updates
- Share feedback

**Happy Coding! 🚀**

---

**END OF DOCUMENTATION INDEX**

*Start your journey by reading TECHNICAL_DOCUMENTATION_MASTER.md*
