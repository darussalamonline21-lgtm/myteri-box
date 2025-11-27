# ⚡ QUICK REFERENCE GUIDE FOR CONTRIBUTORS

**Project**: Mystery Box Campaign Application  
**Purpose**: Fast lookup reference for common tasks  
**Date**: 2025-11-25  

---

## 🎯 I WANT TO...

### 🔹 Add a New API Endpoint

**Steps:**
1. Create handler function in appropriate controller
2. Add route in appropriate route file
3. Add middleware if needed (protect, authorize)
4. Update frontend service/page to call endpoint
5. Test with Postman/Thunder Client
6. Update API documentation

**Example:**
```javascript
// Backend: controllers/campaignController.js
export const getBoxDetails = async (req, res) => {
  try {
    const boxId = parseIdToBigInt(req.params.boxId);
    const box = await prisma.box.findUnique({ where: { id: boxId } });
    res.status(200).json(box);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Backend: routes/boxRoutes.js
import { getBoxDetails } from '../controllers/campaignController.js';
router.get('/:boxId', protect, getBoxDetails);

// Frontend: DashboardPage.jsx
const fetchBoxDetails = async (boxId) => {
  const response = await apiClient.get(`/boxes/${boxId}`);
  return response.data;
};
```

---

### 🔹 Add a New React Component

**Steps:**
1. Create component file in `frontend/src/components/`
2. Import React and necessary libraries
3. Define component with props
4. Export with React.memo if it's a list item
5. Import and use in parent component
6. Add to component documentation

**Example:**
```javascript
// frontend/src/components/PrizeCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

const PrizeCard = ({ prize, onClick }) => {
  return (
    <motion.div
      className="bg-gray-800 p-4 rounded-lg"
      whileHover={{ scale: 1.05 }}
      onClick={() => onClick(prize.id)}
    >
      <h3>{prize.name}</h3>
      <p>{prize.tier}</p>
    </motion.div>
  );
};

export default React.memo(PrizeCard);

// Usage in parent
import PrizeCard from '../components/PrizeCard';

<PrizeCard prize={prize} onClick={handlePrizeClick} />
```

---

### 🔹 Add a New Database Table

**Steps:**
1. Update `backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_table_name`
3. Run `npx prisma generate` to update Prisma client
4. Create controller functions for CRUD
5. Add routes
6. Update frontend to use new endpoints
7. Update database documentation

**Example:**
```prisma
// backend/prisma/schema.prisma
model Notification {
  id        BigInt   @id @default(autoincrement())
  userId    BigInt
  message   String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([userId])
}

model User {
  // ... existing fields
  notifications Notification[]
}
```

```bash
# Run migration
cd backend
npx prisma migrate dev --name add_notification_table
npx prisma generate
```

---

### 🔹 Add a New Prize Type

**Steps:**
1. Admin creates prize via Campaign Detail page
2. Set tier (S/A/B/C), type, stock, probability
3. Upload image or provide URL
4. Prize automatically included in selection algorithm
5. No code changes needed!

**Via API:**
```javascript
// Frontend: CampaignDetailPage.jsx
const formData = new FormData();
formData.append('name', 'New Prize');
formData.append('tier', 'A');
formData.append('type', 'voucher');
formData.append('stockTotal', 100);
formData.append('baseProbability', 0.5);
formData.append('image', file);

await apiClient.post(`/admin/campaigns/${id}/prizes`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

---

### 🔹 Debug a Race Condition

**Common Symptoms:**
- Box opened twice by different users
- Prize stock goes negative
- Coupon balance incorrect

**Debugging Steps:**

1. **Check transaction logs:**
```javascript
// Add logging in boxService.js
console.log('[TRANSACTION START] BoxId:', boxId, 'UserId:', userId);
console.log('[BOX STATUS]', boxToOpen.status);
console.log('[COUPON BALANCE]', currentBalance);
console.log('[PRIZE SELECTED]', selectedPrize.id);
console.log('[TRANSACTION END]');
```

2. **Verify optimistic locking:**
```javascript
// Ensure updateMany uses conditions
const result = await tx.box.updateMany({
  where: { id: boxId, status: { not: 'opened' } }, // ← CRITICAL
  data: { status: 'opened' }
});

// MUST check count
if (result.count === 0) {
  throw new BoxAlreadyOpenedError();
}
```

3. **Test with concurrent requests:**
```javascript
// Create test script
const promises = [];
for (let i = 0; i < 10; i++) {
  promises.push(
    axios.post(`http://localhost:5000/api/boxes/1/open`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
  );
}

const results = await Promise.allSettled(promises);
console.log('Success:', results.filter(r => r.status === 'fulfilled').length);
console.log('Failed:', results.filter(r => r.status === 'rejected').length);
// Should have 1 success, 9 failures (BOX_ALREADY_OPENED)
```

4. **Check database isolation level:**
```sql
-- PostgreSQL default is READ COMMITTED
-- Prisma transactions use this by default
SHOW transaction_isolation;
```

---

### 🔹 Add Authentication to New Route

**User Route:**
```javascript
// Backend: routes/newRoutes.js
import { protect } from '../middlewares/authMiddleware.js';

router.get('/protected-endpoint', protect, yourController);

// In controller:
export const yourController = async (req, res) => {
  const userId = req.user.id; // ← Available from protect middleware
  // ... your logic
};
```

**Admin Route:**
```javascript
// Backend: routes/adminRoutes.js
import { protectAdmin, authorize } from '../middlewares/authMiddleware.js';

router.post('/admin-only', protectAdmin, authorize('superadmin'), yourController);

// In controller:
export const yourController = async (req, res) => {
  const adminId = req.admin.id; // ← Available from protectAdmin
  const adminRole = req.admin.role; // ← superadmin, manager, etc.
  // ... your logic
};
```

---

### 🔹 Handle File Uploads

**Backend Setup:**
```javascript
// middlewares/uploadMiddleware.js already configured
import { uploadPrizeImage } from '../middlewares/uploadMiddleware.js';

// In route:
router.post('/upload', protect, uploadPrizeImage.single('image'), controller);

// In controller:
export const controller = async (req, res) => {
  const imageUrl = req.file ? `/uploads/prizes/${req.file.filename}` : null;
  // Save imageUrl to database
};
```

**Frontend:**
```javascript
const [file, setFile] = useState(null);

const handleFileChange = (e) => {
  setFile(e.target.files[0]);
};

const handleSubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('name', name);
  formData.append('image', file);
  
  await apiClient.post('/endpoint', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// JSX
<input type="file" onChange={handleFileChange} accept="image/*" />
```

---

### 🔹 Add Real-time Updates (Polling)

**Current Pattern (DashboardPage.jsx):**
```javascript
useEffect(() => {
  if (!selectedRoom) return;
  
  const interval = setInterval(() => {
    fetchBoxes({ silent: true }); // Silent = no loading indicator
  }, 8000); // 8 seconds
  
  return () => clearInterval(interval); // Cleanup
}, [selectedRoom, fetchBoxes]);
```

**For New Feature:**
```javascript
useEffect(() => {
  if (!shouldPoll) return;
  
  const interval = setInterval(() => {
    fetchYourData({ silent: true });
  }, 10000); // Adjust interval as needed
  
  return () => clearInterval(interval);
}, [shouldPoll, fetchYourData]);
```

**⚠️ Warning**: Don't set interval < 5 seconds (server load)

---

### 🔹 Add Optimistic UI Update

**Pattern:**
```javascript
const handleAction = async (itemId) => {
  // 1. Optimistically update UI
  setItems(prevItems => 
    prevItems.map(item => 
      item.id === itemId 
        ? { ...item, status: 'updated' } 
        : item
    )
  );
  
  try {
    // 2. Send request to backend
    const response = await apiClient.post(`/items/${itemId}/action`);
    
    // 3. Update with real data from server
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? response.data 
          : item
      )
    );
  } catch (error) {
    // 4. Revert on error
    fetchItems(); // Re-fetch to get correct state
    setError(error.message);
  }
};
```

---

### 🔹 Add Custom Error Type

**Backend:**
```javascript
// utils/errors.js
export class YourCustomError extends ServiceError {
  constructor(message = 'Default message') {
    super(message, 'YOUR_ERROR_CODE');
  }
}

// In service:
import { YourCustomError } from '../utils/errors.js';
throw new YourCustomError('Specific error message');

// In controller:
import { YourCustomError } from '../utils/errors.js';

if (error instanceof YourCustomError) {
  return res.status(400).json({ 
    code: error.code, 
    message: error.message 
  });
}
```

**Frontend:**
```javascript
// Handle in catch block
catch (error) {
  if (error.response?.data?.code === 'YOUR_ERROR_CODE') {
    // Handle specifically
    setError('User-friendly message');
  } else {
    // Generic error
    setError('Something went wrong');
  }
}
```

---

### 🔹 Add Database Index

**When to add:**
- Slow queries (check with `EXPLAIN ANALYZE`)
- Frequent WHERE clauses on column
- Foreign key columns (usually auto-indexed)

**How to add:**
```prisma
// schema.prisma
model Box {
  id         BigInt   @id @default(autoincrement())
  campaignId BigInt
  status     String   @default("available")
  
  @@index([campaignId]) // ← Already exists
  @@index([status])     // ← Add if filtering by status often
  @@index([campaignId, status]) // ← Composite index for both
}
```

```bash
npx prisma migrate dev --name add_box_status_index
```

---

### 🔹 Add Framer Motion Animation

**Simple Animation:**
```javascript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

**With AnimatePresence (for conditional rendering):**
```javascript
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence>
  {showModal && (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      Modal content
    </motion.div>
  )}
</AnimatePresence>
```

**Gesture Animations:**
```javascript
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 15 }}
>
  Click me
</motion.button>
```

---

### 🔹 Query Database with Prisma

**Find One:**
```javascript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, name: true, storeCode: true }
});
```

**Find Many with Filter:**
```javascript
const boxes = await prisma.box.findMany({
  where: { 
    campaignId: campaignId,
    status: 'available'
  },
  orderBy: { id: 'asc' },
  take: 100, // Limit
  skip: 0    // Offset
});
```

**Count:**
```javascript
const totalBoxes = await prisma.box.count({
  where: { campaignId: campaignId }
});
```

**Aggregate:**
```javascript
const stats = await prisma.userCouponBalance.aggregate({
  _sum: { totalEarned: true, totalUsed: true },
  where: { campaignId: campaignId }
});
const total = stats._sum.totalEarned || 0;
```

**Create:**
```javascript
const newBox = await prisma.box.create({
  data: {
    campaignId: campaignId,
    name: 'Box #1',
    status: 'available'
  }
});
```

**Update:**
```javascript
const updated = await prisma.box.update({
  where: { id: boxId },
  data: { status: 'opened' }
});
```

**Update Many (with condition):**
```javascript
const result = await prisma.box.updateMany({
  where: { 
    id: boxId, 
    status: { not: 'opened' } // ← Optimistic locking
  },
  data: { status: 'opened' }
});

if (result.count === 0) {
  throw new Error('Update failed - condition not met');
}
```

**Transaction:**
```javascript
const result = await prisma.$transaction(async (tx) => {
  const box = await tx.box.update({ ... });
  const prize = await tx.prize.update({ ... });
  const log = await tx.userBoxOpenLog.create({ ... });
  
  return { box, prize, log };
});
```

---

### 🔹 Add State Management

**Simple State:**
```javascript
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState('');
```

**Lazy Initialization (expensive initial value):**
```javascript
const [data, setData] = useState(() => {
  const stored = localStorage.getItem('key');
  return stored ? JSON.parse(stored) : defaultValue;
});
```

**State with useCallback (stable reference):**
```javascript
const fetchData = useCallback(async () => {
  setIsLoading(true);
  try {
    const response = await apiClient.get('/endpoint');
    setData(response.data);
  } catch (error) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
}, [dependency1, dependency2]);
```

**State with useMemo (computed value):**
```javascript
const filteredData = useMemo(() => {
  return data.filter(item => item.status === 'active');
}, [data]);
```

---

### 🔹 Handle Form Submission

**Pattern:**
```javascript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  phone: ''
});

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};

const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    await apiClient.post('/endpoint', formData);
    // Success handling
    setFormData({ name: '', email: '', phone: '' }); // Reset
  } catch (error) {
    // Error handling
    setError(error.response?.data?.message);
  }
};

// JSX
<form onSubmit={handleSubmit}>
  <input 
    name="name" 
    value={formData.name} 
    onChange={handleChange} 
    required 
  />
  <input 
    name="email" 
    type="email"
    value={formData.email} 
    onChange={handleChange} 
    required 
  />
  <button type="submit">Submit</button>
</form>
```

---

### 🔹 Add Middleware

**Authentication Middleware (already exists):**
```javascript
// middlewares/authMiddleware.js
export const protect = async (req, res, next) => {
  // Extract token from header
  // Verify token
  // Attach user to req.user
  // Call next()
};
```

**Custom Middleware Example:**
```javascript
// middlewares/rateLimitMiddleware.js
const requestCounts = new Map();

export const rateLimit = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    if (!requestCounts.has(key)) {
      requestCounts.set(key, []);
    }
    
    const requests = requestCounts.get(key);
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ message: 'Too many requests' });
    }
    
    recentRequests.push(now);
    requestCounts.set(key, recentRequests);
    next();
  };
};

// Usage:
router.post('/boxes/:id/open', protect, rateLimit(10, 60000), openBoxController);
```

---

### 🔹 Add Validation

**Backend (Manual):**
```javascript
export const createPrize = async (req, res) => {
  const { name, tier, stockTotal, baseProbability } = req.body;
  
  // Validation
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ message: 'Name is required' });
  }
  
  if (!['S', 'A', 'B', 'C'].includes(tier)) {
    return res.status(400).json({ message: 'Invalid tier' });
  }
  
  if (stockTotal < 1) {
    return res.status(400).json({ message: 'Stock must be at least 1' });
  }
  
  if (baseProbability < 0) {
    return res.status(400).json({ message: 'Probability must be non-negative' });
  }
  
  // Proceed with creation
};
```

**Frontend (HTML5):**
```javascript
<input 
  type="text" 
  required 
  minLength={3}
  maxLength={100}
  pattern="[A-Za-z0-9\s]+"
/>

<input 
  type="number" 
  required 
  min={1}
  max={1000000}
  step={1}
/>

<input 
  type="email" 
  required 
/>
```

---

### 🔹 Debug API Call

**Frontend:**
```javascript
// Add logging
console.log('[API CALL] Endpoint:', endpoint);
console.log('[API CALL] Payload:', payload);

try {
  const response = await apiClient.post(endpoint, payload);
  console.log('[API RESPONSE]', response.data);
} catch (error) {
  console.error('[API ERROR]', error);
  console.error('[API ERROR] Response:', error.response?.data);
  console.error('[API ERROR] Status:', error.response?.status);
}
```

**Backend:**
```javascript
// Add logging in controller
console.log('[CONTROLLER] Endpoint hit:', req.method, req.url);
console.log('[CONTROLLER] Body:', req.body);
console.log('[CONTROLLER] Params:', req.params);
console.log('[CONTROLLER] User:', req.user?.id);

try {
  const result = await yourService();
  console.log('[CONTROLLER] Result:', result);
  res.status(200).json(result);
} catch (error) {
  console.error('[CONTROLLER] Error:', error);
  res.status(500).json({ message: error.message });
}
```

**Check Network Tab:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by XHR/Fetch
4. Click on request
5. Check:
   - Request URL
   - Request Headers (Authorization?)
   - Request Payload
   - Response Status
   - Response Data

---

### 🔹 Add Environment Variable

**Backend:**
```javascript
// 1. Add to .env file
NEW_CONFIG_VALUE=something

// 2. Use in code
const configValue = process.env.NEW_CONFIG_VALUE;

// 3. Add default fallback
const configValue = process.env.NEW_CONFIG_VALUE || 'default';
```

**Frontend:**
```javascript
// 1. Add to .env file (must start with VITE_)
VITE_NEW_CONFIG=something

// 2. Use in code
const configValue = import.meta.env.VITE_NEW_CONFIG;

// 3. Add default fallback
const configValue = import.meta.env.VITE_NEW_CONFIG || 'default';
```

**⚠️ Important:**
- Restart dev server after changing .env
- Never commit .env to git
- Use .env.example for documentation

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue: "Cannot read property 'id' of undefined"

**Cause**: Accessing property before data is loaded

**Solution:**
```javascript
// Bad
const userId = user.id; // ← Error if user is null

// Good
const userId = user?.id; // ← Optional chaining
const userId = user && user.id; // ← Short-circuit
const userId = user?.id ?? 'default'; // ← With fallback
```

### Issue: "Headers already sent"

**Cause**: Multiple res.send() or res.json() calls

**Solution:**
```javascript
// Bad
if (error) {
  res.status(400).json({ message: 'Error' });
}
res.status(200).json({ message: 'Success' }); // ← Error!

// Good
if (error) {
  return res.status(400).json({ message: 'Error' }); // ← return!
}
res.status(200).json({ message: 'Success' });
```

### Issue: "Cannot perform a React state update on unmounted component"

**Cause**: Async operation completes after component unmounts

**Solution:**
```javascript
useEffect(() => {
  let isMounted = true;
  
  const fetchData = async () => {
    const data = await apiClient.get('/endpoint');
    if (isMounted) {
      setData(data); // ← Only update if still mounted
    }
  };
  
  fetchData();
  
  return () => {
    isMounted = false; // ← Cleanup
  };
}, []);
```

### Issue: "BigInt cannot be serialized to JSON"

**Cause**: Prisma returns BigInt for @id fields

**Solution:**
```javascript
// Convert to string before sending
res.status(200).json({
  id: box.id.toString(), // ← Convert BigInt to string
  campaignId: box.campaignId.toString()
});
```

### Issue: "CORS error"

**Cause**: Frontend and backend on different origins

**Solution:**
```javascript
// Backend: app.js
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true
}));
```

### Issue: "Token expired"

**Cause**: JWT token older than expiration time

**Solution:**
- User will be auto-logged out (apiClient.js handles this)
- User must login again
- To extend: increase JWT_ACCESS_TOKEN_EXPIRATION in .env

---

## 🧪 TESTING CHECKLIST

### Before Committing Code:

- [ ] Code runs without errors
- [ ] No console errors in browser
- [ ] No console errors in backend logs
- [ ] API endpoints return expected data
- [ ] Error cases handled gracefully
- [ ] Loading states work correctly
- [ ] Optimistic updates revert on error
- [ ] Animations don't cause performance issues
- [ ] Mobile responsive (test in DevTools)
- [ ] Accessibility (keyboard navigation, screen readers)

### Before Deploying:

- [ ] Run production build (`npm run build`)
- [ ] Test production build locally
- [ ] Check bundle size
- [ ] Run database migrations
- [ ] Update environment variables
- [ ] Test with production database (staging)
- [ ] Check CORS configuration
- [ ] Verify file upload paths
- [ ] Test authentication flow
- [ ] Test critical user flows (login, open box, view prizes)

---

## 📚 USEFUL COMMANDS

### Development

```bash
# Start backend dev server
cd backend
npm run dev

# Start frontend dev server
cd frontend
npm run dev

# Run both concurrently (if configured)
npm run dev
```

### Database

```bash
# Create new migration
cd backend
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (⚠️ DELETES ALL DATA)
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio

# Generate Prisma Client (after schema changes)
npx prisma generate

# Format schema file
npx prisma format
```

### Build & Deploy

```bash
# Build frontend
cd frontend
npm run build
# Output: frontend/dist/

# Build backend (if using TypeScript - not in this project)
cd backend
npm run build

# Start production server
cd backend
NODE_ENV=production node src/server.js
```

### Debugging

```bash
# Check backend logs
cd backend
tail -f logs/app.log

# Check Node.js version
node --version

# Check npm version
npm --version

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 🔗 QUICK LINKS

### Documentation Files:
- [TECHNICAL_DOCUMENTATION_MASTER.md](./TECHNICAL_DOCUMENTATION_MASTER.md) - Overview
- [TECHNICAL_DOCUMENTATION_LOGIN_FLOW.md](./TECHNICAL_DOCUMENTATION_LOGIN_FLOW.md) - Login
- [TECHNICAL_DOCUMENTATION_BOX_OPENING_FLOW.md](./TECHNICAL_DOCUMENTATION_BOX_OPENING_FLOW.md) - Box Opening
- [IMPORT_DEPENDENCY_GRAPH.md](./IMPORT_DEPENDENCY_GRAPH.md) - Import relationships

### External Resources:
- [React Docs](https://react.dev)
- [Prisma Docs](https://www.prisma.io/docs)
- [Express Docs](https://expressjs.com)
- [Framer Motion Docs](https://www.framer.com/motion)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## 💡 PRO TIPS

### 1. Use VS Code Extensions
- **ES7+ React/Redux/React-Native snippets** - Fast component creation
- **Prisma** - Schema syntax highlighting
- **Tailwind CSS IntelliSense** - Class autocomplete
- **ESLint** - Code quality
- **Prettier** - Code formatting

### 2. Keyboard Shortcuts
- `Ctrl + P` - Quick file open
- `Ctrl + Shift + F` - Search in all files
- `F12` - Go to definition
- `Shift + F12` - Find all references
- `Ctrl + .` - Quick fix

### 3. Debugging Tricks
```javascript
// Quick object inspection
console.log({ userId, boxId, prize }); // ← Named logging

// Conditional breakpoint in DevTools
// Right-click breakpoint → Edit → Add condition
// Example: boxId === '123'

// Performance timing
console.time('operation');
await expensiveOperation();
console.timeEnd('operation'); // ← Logs duration
```

### 4. Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Commit with meaningful message
git add .
git commit -m "feat: add prize filtering by tier"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

---

## 🎓 LEARNING RESOURCES

### For React Beginners:
1. Official React Tutorial
2. React Hooks documentation
3. React Router tutorial

### For Backend Beginners:
1. Express.js Getting Started
2. Prisma Quickstart
3. JWT.io (understand tokens)

### For This Project:
1. Read TECHNICAL_DOCUMENTATION_MASTER.md
2. Study LOGIN_FLOW.md
3. Study BOX_OPENING_FLOW.md
4. Explore code with VS Code
5. Run the app and test features
6. Make small changes and observe effects

---

**END OF QUICK REFERENCE GUIDE**

*Keep this file bookmarked for quick lookup during development!*
