import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;
const COOLDOWN = 3600 * 1000; // 1 hour in milliseconds

// Enable CORS for all routes
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Include cookies if needed
}));
app.use(express.json());
app.use(cookieParser());

// Mock data for coupons
const COUPONS = [
  {
    id: "1",
    code: "SAVE20",
    discount: 20,
    description: "Save 20% on your next purchase",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  },
  {
    id: "2",
    code: "FREESHIP",
    discount: 100,
    description: "Free shipping on orders over $50",
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
  },
  {
    id: "3",
    code: "SUMMER25",
    discount: 25,
    description: "Summer sale discount on all items",
    expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
  },
  {
    id: "4",
    code: "WELCOME10",
    discount: 10,
    description: "Welcome discount for new customers",
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
  },
  {
    id: "5",
    code: "WELCOME11",
    discount: 19,
    description: "Welcome discount for new customers",
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
  },
  {
    id: "6",
    code: "WELCOME12",
    discount: 155,
    description: "Welcome discount for new customers",
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
  },
];

// Round-robin coupon index tracker
let currentIndex = 0;

// Abuse prevention stores using Maps
const ipClaims = new Map();
const cookieClaims = new Map();



function checkEligibility(ip, cookieId) {
  const now = Date.now();

  // Check IP cooldown
  if (ipClaims.has(ip)) {
    const lastClaimTime = ipClaims.get(ip);
    if (now - lastClaimTime < COOLDOWN) {
      return {
        eligible: false,
        remaining: Math.ceil((COOLDOWN - (now - lastClaimTime)) / 1000),
      };
    } else {
      ipClaims.delete(ip); // Remove expired cooldown
    }
  }

  // Check Cookie cooldown
  if (cookieId && cookieClaims.has(cookieId)) {
    const lastClaimTime = cookieClaims.get(cookieId);
    if (now - lastClaimTime < COOLDOWN) {
      return {
        eligible: false,
        remaining: Math.ceil((COOLDOWN - (now - lastClaimTime)) / 1000),
      };
    } else {
      cookieClaims.delete(cookieId); // Remove expired cooldown
    }
  }

  return { eligible: true, remaining: 0 };
}
// Helper function to get the client IP address
function getClientIp(req) {
    const forwarded = req.headers["x-forwarded-for"];
    return forwarded ? forwarded.split(/, /)[0] : req.ip;
  }


/**
 * Check eligibility based on IP and cookie.
 * Returns an object with:
 *  - eligible: boolean
 *  - remaining: remaining cooldown time (in seconds)
 */
// In your routes, use the helper function:
app.get("/eligibility", (req, res) => {
    const ip = getClientIp(req);
    const cookieId = req.cookies["couponTracker"];
    const eligibility = checkEligibility(ip, cookieId);
    const nextCoupon = COUPONS[currentIndex] || null;
  
    res.json({
      ...eligibility,
      claimedCoupon: null,
      nextCoupon,
    });
  });

// Endpoint to get all available coupons
app.get("/coupons", (req, res) => {
  res.json(COUPONS);
});

// Endpoint to check user eligibility
app.get("/eligibility", (req, res) => {
  const ip = req.ip;
  const cookieId = req.cookies["couponTracker"];
  const eligibility = checkEligibility(ip, cookieId);

  // For simplicity, include next coupon info as round-robin state
  const nextCoupon = COUPONS[currentIndex] || null;

  res.json({
    ...eligibility,
    claimedCoupon: null, // Not tracking claimed coupon here
    nextCoupon,
  });
});

// Endpoint to claim a coupon
app.post("/claim", (req, res) => {
  const ip = getClientIp(req);
  let cookieId = req.cookies["couponTracker"];

  if (!cookieId) {
    cookieId = Math.random().toString(36).substring(2);
    res.cookie("couponTracker", cookieId, {
      maxAge: COOLDOWN,
      httpOnly: true,
    });
  }

  const eligibility = checkEligibility(ip, cookieId);
  if (!eligibility.eligible) {
    return res.status(429).json({
      error: `Not eligible to claim a coupon yet. Try again in ${eligibility.remaining} seconds.`,
    });
  }

  if (COUPONS.length === 0) {
    return res.status(404).json({ error: "No coupons available." });
  }

  const coupon = COUPONS[currentIndex];
  currentIndex = (currentIndex + 1) % COUPONS.length;

  const now = Date.now();
  ipClaims.set(ip, now);
  cookieClaims.set(cookieId, now);

  res.json({ claimedCoupon: coupon });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
