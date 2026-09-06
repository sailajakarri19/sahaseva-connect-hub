export type Role = "CUSTOMER" | "WORKER" | "ADMIN";

export type BookingStatus =
  | "Requested"
  | "Accepted"
  | "On The Way"
  | "Arrived"
  | "In Service"
  | "Completed"
  | "Cancelled";

export const roleHome: Record<Role, string> = {
  CUSTOMER: "/app",
  WORKER: "/worker",
  ADMIN: "/admin",
};

export const roleLabel: Record<Role, string> = {
  CUSTOMER: "Customer",
  WORKER: "Cooperative Worker",
  ADMIN: "Admin",
};

export type DemoAccount = {
  email: string;
  password: string;
  name: string;
  role: Role;
  org: string;
  location: string;
};

export const demoAccounts: DemoAccount[] = [
  {
    email: "lakshmi@sahaseva.in",
    password: "DEMO1234",
    name: "Lakshmi Devi",
    role: "CUSTOMER",
    org: "Household customer",
    location: "Kondapur, Sangareddy",
  },
  {
    email: "ravi@sahaseva.in",
    password: "DEMO1234",
    name: "Ravi Kumar",
    role: "WORKER",
    org: "Sangareddy Labour Co-op Society",
    location: "Sangareddy Mandal",
  },
  {
    email: "admin@sahaseva.in",
    password: "DEMO1234",
    name: "Admin",
    role: "ADMIN",
    org: "SahaSeva Platform",
    location: "All societies",
  },
];

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  subservices: { name: string; base: number; range: [number, number] }[];
};

export const categories: Category[] = [
  {
    id: "electrical",
    name: "Electrical",
    icon: "Zap",
    color: "var(--warning)",
    subservices: [
      { name: "Fan installation", base: 350, range: [300, 500] },
      { name: "Fan repair", base: 300, range: [250, 450] },
      { name: "Light installation", base: 250, range: [200, 400] },
      { name: "Switch / socket repair", base: 200, range: [150, 350] },
      { name: "House wiring", base: 900, range: [700, 2500] },
      { name: "Basic electrical maintenance", base: 400, range: [300, 700] },
      { name: "Inverter service", base: 500, range: [400, 900] },
    ],
  },
  {
    id: "plumbing",
    name: "Plumbing",
    icon: "Droplets",
    color: "var(--chart-5)",
    subservices: [
      { name: "Tap repair", base: 250, range: [200, 400] },
      { name: "Pipe repair", base: 350, range: [300, 600] },
      { name: "Sink / drain blockage", base: 400, range: [300, 700] },
      { name: "Bathroom plumbing", base: 600, range: [450, 1200] },
      { name: "Water tank cleaning", base: 700, range: [600, 1400] },
      { name: "Leakage repair", base: 300, range: [250, 550] },
    ],
  },
  {
    id: "cleaning",
    name: "Cleaning",
    icon: "Sparkles",
    color: "var(--success)",
    subservices: [
      { name: "Home cleaning", base: 600, range: [500, 1200] },
      { name: "Bathroom cleaning", base: 350, range: [300, 600] },
      { name: "Kitchen cleaning", base: 450, range: [350, 800] },
      { name: "Deep cleaning", base: 1500, range: [1200, 3000] },
      { name: "Office cleaning", base: 1200, range: [900, 2500] },
    ],
  },
  {
    id: "carpentry",
    name: "Carpentry",
    icon: "Hammer",
    color: "var(--accent)",
    subservices: [
      { name: "Furniture repair", base: 450, range: [350, 900] },
      { name: "Door repair", base: 400, range: [300, 800] },
      { name: "Shelf installation", base: 350, range: [300, 650] },
      { name: "Basic woodwork", base: 600, range: [450, 1500] },
    ],
  },
  {
    id: "painting",
    name: "Painting",
    icon: "Paintbrush",
    color: "var(--chart-4)",
    subservices: [
      { name: "Room painting", base: 2200, range: [1800, 4500] },
      { name: "Wall painting", base: 1200, range: [900, 2500] },
      { name: "Touch-up work", base: 500, range: [400, 900] },
      { name: "Exterior painting", base: 3000, range: [2500, 7000] },
    ],
  },
  {
    id: "gardening",
    name: "Gardening",
    icon: "Sprout",
    color: "var(--success)",
    subservices: [
      { name: "Garden maintenance", base: 500, range: [400, 900] },
      { name: "Plant care", base: 300, range: [250, 500] },
      { name: "Lawn maintenance", base: 600, range: [450, 1000] },
    ],
  },
  {
    id: "appliance",
    name: "Appliance & Technician",
    icon: "Wrench",
    color: "var(--chart-5)",
    subservices: [
      { name: "Appliance inspection", base: 250, range: [200, 400] },
      { name: "Appliance installation", base: 500, range: [400, 900] },
      { name: "Basic appliance repair", base: 450, range: [350, 1200] },
    ],
  },
  {
    id: "caregiving",
    name: "Caregiving",
    icon: "HeartHandshake",
    color: "var(--destructive)",
    subservices: [
      { name: "Elder care visit", base: 700, range: [600, 1400] },
      { name: "Patient attendant (day)", base: 1100, range: [900, 1800] },
      { name: "Child care support", base: 800, range: [600, 1500] },
    ],
  },
  {
    id: "driving",
    name: "Driving",
    icon: "Car",
    color: "var(--primary)",
    subservices: [
      { name: "Local driver (half day)", base: 700, range: [600, 1100] },
      { name: "Outstation driver (day)", base: 1400, range: [1200, 2200] },
    ],
  },
  {
    id: "domestic",
    name: "Domestic Services",
    icon: "Home",
    color: "var(--accent)",
    subservices: [
      { name: "Cooking help", base: 600, range: [500, 1100] },
      { name: "Household help (daily)", base: 500, range: [400, 900] },
    ],
  },
  {
    id: "construction",
    name: "Construction & Maintenance",
    icon: "HardHat",
    color: "var(--warning)",
    subservices: [
      { name: "Masonry repair", base: 900, range: [700, 2200] },
      { name: "Tile work", base: 1200, range: [900, 3000] },
      { name: "General building maintenance", base: 800, range: [600, 2000] },
    ],
  },
];

export type Worker = {
  id: string;
  name: string;
  categoryId: string;
  skills: string[];
  society: string;
  membershipId: string;
  rating: number;
  jobs: number;
  experience: number;
  distanceKm: number;
  etaMin: number;
  availableNow: boolean;
  hourly: number;
  languages: string[];
  area: string;
  radiusKm: number;
  completionRate: number;
  verified: { identity: boolean; skill: boolean; certificate: boolean; member: boolean };
  status: "Verified" | "Pending" | "Suspended";
  insurance: string;
  photoTint: string;
};

export const societies = [
  "Sangareddy Labour Co-op Society",
  "Zaheerabad Rural Workers Society",
  "Medak Skilled Trades Co-op",
  "Narayankhed Community Services Society",
] as const;

export const workers: Worker[] = [
  {
    id: "SS-W-1042",
    name: "Ravi Kumar",
    categoryId: "electrical",
    skills: ["Fan repair", "Wiring", "Inverter service", "Light installation"],
    society: societies[0],
    membershipId: "SLC/2019/1042",
    rating: 4.8,
    jobs: 412,
    experience: 9,
    distanceKm: 1.8,
    etaMin: 10,
    availableNow: true,
    hourly: 300,
    languages: ["Telugu", "Hindi", "English"],
    area: "Sangareddy Mandal",
    radiusKm: 12,
    completionRate: 98,
    verified: { identity: true, skill: true, certificate: true, member: true },
    status: "Verified",
    insurance: "Active till Mar 2027",
    photoTint: "var(--primary)",
  },
  {
    id: "SS-W-1088",
    name: "Suresh Yadav",
    categoryId: "plumbing",
    skills: ["Tap repair", "Leakage repair", "Bathroom plumbing"],
    society: societies[0],
    membershipId: "SLC/2020/1088",
    rating: 4.6,
    jobs: 297,
    experience: 7,
    distanceKm: 2.6,
    etaMin: 16,
    availableNow: true,
    hourly: 280,
    languages: ["Telugu", "Hindi"],
    area: "Kondapur & nearby villages",
    radiusKm: 15,
    completionRate: 96,
    verified: { identity: true, skill: true, certificate: true, member: true },
    status: "Verified",
    insurance: "Active till Nov 2026",
    photoTint: "var(--chart-5)",
  },
  {
    id: "SS-W-1123",
    name: "Padma Bai",
    categoryId: "cleaning",
    skills: ["Home cleaning", "Deep cleaning", "Kitchen cleaning"],
    society: societies[1],
    membershipId: "ZRW/2021/0123",
    rating: 4.9,
    jobs: 508,
    experience: 6,
    distanceKm: 3.4,
    etaMin: 22,
    availableNow: false,
    hourly: 220,
    languages: ["Telugu", "Marathi"],
    area: "Zaheerabad Town",
    radiusKm: 10,
    completionRate: 99,
    verified: { identity: true, skill: true, certificate: false, member: true },
    status: "Verified",
    insurance: "Active till Jun 2026",
    photoTint: "var(--success)",
  },
  {
    id: "SS-W-1187",
    name: "Mohd. Imran",
    categoryId: "carpentry",
    skills: ["Furniture repair", "Door repair", "Basic woodwork"],
    society: societies[2],
    membershipId: "MST/2018/0187",
    rating: 4.7,
    jobs: 341,
    experience: 11,
    distanceKm: 5.1,
    etaMin: 28,
    availableNow: true,
    hourly: 320,
    languages: ["Urdu", "Telugu", "Hindi"],
    area: "Medak Town + 3 mandals",
    radiusKm: 20,
    completionRate: 95,
    verified: { identity: true, skill: true, certificate: true, member: true },
    status: "Verified",
    insurance: "Active till Aug 2026",
    photoTint: "var(--accent)",
  },
  {
    id: "SS-W-1206",
    name: "Kavitha Naik",
    categoryId: "painting",
    skills: ["Room painting", "Touch-up work", "Exterior painting"],
    society: societies[1],
    membershipId: "ZRW/2022/0206",
    rating: 4.5,
    jobs: 168,
    experience: 5,
    distanceKm: 7.2,
    etaMin: 35,
    availableNow: true,
    hourly: 260,
    languages: ["Telugu"],
    area: "Zaheerabad rural cluster",
    radiusKm: 18,
    completionRate: 93,
    verified: { identity: true, skill: true, certificate: false, member: true },
    status: "Verified",
    insurance: "Renewal due in 21 days",
    photoTint: "var(--chart-4)",
  },
  {
    id: "SS-W-1244",
    name: "Narsimha Goud",
    categoryId: "appliance",
    skills: ["Appliance repair", "Installation", "Inspection"],
    society: societies[2],
    membershipId: "MST/2021/0244",
    rating: 4.4,
    jobs: 122,
    experience: 4,
    distanceKm: 4.3,
    etaMin: 24,
    availableNow: false,
    hourly: 290,
    languages: ["Telugu", "Hindi"],
    area: "Medak Mandal",
    radiusKm: 14,
    completionRate: 91,
    verified: { identity: true, skill: true, certificate: true, member: true },
    status: "Verified",
    insurance: "Active till Jan 2027",
    photoTint: "var(--chart-5)",
  },
  {
    id: "SS-W-1301",
    name: "Yellamma S.",
    categoryId: "caregiving",
    skills: ["Elder care", "Patient attendant"],
    society: societies[3],
    membershipId: "NCS/2023/0301",
    rating: 4.8,
    jobs: 87,
    experience: 8,
    distanceKm: 6.0,
    etaMin: 31,
    availableNow: true,
    hourly: 240,
    languages: ["Telugu", "Kannada"],
    area: "Narayankhed cluster",
    radiusKm: 16,
    completionRate: 97,
    verified: { identity: true, skill: true, certificate: true, member: true },
    status: "Verified",
    insurance: "Active till Sep 2026",
    photoTint: "var(--destructive)",
  },
  {
    id: "SS-W-1355",
    name: "Ganesh Rathod",
    categoryId: "gardening",
    skills: ["Garden maintenance", "Lawn maintenance", "Plant care"],
    society: societies[3],
    membershipId: "NCS/2024/0355",
    rating: 4.2,
    jobs: 46,
    experience: 3,
    distanceKm: 9.4,
    etaMin: 42,
    availableNow: true,
    hourly: 200,
    languages: ["Telugu", "Lambadi"],
    area: "Narayankhed villages",
    radiusKm: 22,
    completionRate: 89,
    verified: { identity: true, skill: false, certificate: false, member: true },
    status: "Pending",
    insurance: "Enrollment in progress",
    photoTint: "var(--success)",
  },
];

export type Booking = {
  id: string;
  customer: string;
  workerId: string;
  categoryId: string;
  subservice: string;
  date: string;
  slot: string;
  address: string;
  status: BookingStatus;
  amount: number;
  materials: number;
  coopFee: number;
  platformFee: number;
  payment: "Pending" | "Paid" | "Failed" | "Refunded" | "Disputed";
  txn?: string;
  emergency?: boolean;
  rating?: number;
  recurring?: string;
};

export const bookings: Booking[] = [
  {
    id: "SS-B-90412",
    customer: "Lakshmi Devi",
    workerId: "SS-W-1088",
    categoryId: "plumbing",
    subservice: "Tap repair",
    date: "Today",
    slot: "4:00 PM – 5:00 PM",
    address: "H.No 4-21, Kondapur Village, Sangareddy",
    status: "On The Way",
    amount: 300,
    materials: 100,
    coopFee: 20,
    platformFee: 20,
    payment: "Pending",
    emergency: false,
  },
  {
    id: "SS-B-90388",
    customer: "Lakshmi Devi",
    workerId: "SS-W-1042",
    categoryId: "electrical",
    subservice: "Fan repair",
    date: "Tomorrow",
    slot: "10:00 AM – 11:00 AM",
    address: "H.No 4-21, Kondapur Village, Sangareddy",
    status: "Accepted",
    amount: 300,
    materials: 0,
    coopFee: 20,
    platformFee: 20,
    payment: "Pending",
  },
  {
    id: "SS-B-90201",
    customer: "Lakshmi Devi",
    workerId: "SS-W-1123",
    categoryId: "cleaning",
    subservice: "Deep cleaning",
    date: "12 Aug 2026",
    slot: "9:00 AM – 1:00 PM",
    address: "H.No 4-21, Kondapur Village, Sangareddy",
    status: "Completed",
    amount: 1500,
    materials: 200,
    coopFee: 90,
    platformFee: 60,
    payment: "Paid",
    txn: "TXN-4471-99A2",
    rating: 5,
    recurring: "Monthly",
  },
  {
    id: "SS-B-90155",
    customer: "Sunrise Clinic, Sangareddy",
    workerId: "SS-W-1042",
    categoryId: "electrical",
    subservice: "Basic electrical maintenance",
    date: "02 Aug 2026",
    slot: "6:00 PM – 7:30 PM",
    address: "Main Road, Sangareddy Town",
    status: "Completed",
    amount: 900,
    materials: 250,
    coopFee: 55,
    platformFee: 45,
    payment: "Paid",
    txn: "TXN-4390-71C4",
    rating: 4,
    emergency: true,
  },
];

export const demandZones = [
  { area: "Sangareddy Town", category: "Plumbing", level: "High", jobs: 48, workers: 9 },
  { area: "Kondapur Village", category: "Electrical", level: "High", jobs: 31, workers: 5 },
  { area: "Zaheerabad", category: "Cleaning", level: "Medium", jobs: 22, workers: 11 },
  { area: "Medak Town", category: "Carpentry", level: "Medium", jobs: 18, workers: 8 },
  { area: "Narayankhed", category: "Gardening", level: "Low", jobs: 6, workers: 7 },
  { area: "Jogipet", category: "Painting", level: "Low", jobs: 5, workers: 6 },
] as const;

export const aiInsights = [
  "Electrical demand is expected to rise ~24% tomorrow in Kondapur (festival season load).",
  "Plumbing workers may be insufficient in Sangareddy Town this weekend — 48 jobs vs 9 active workers.",
  "Consider allocating 3 idle Narayankhed workers to Zaheerabad cleaning demand (18 km).",
  "Peak booking windows: 8–10 AM and 5–8 PM on weekdays.",
];

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Rule-based AI assistant: natural language -> category + subservice. */
export function assistantSuggest(text: string) {
  const t = text.toLowerCase();
  const rules: { keys: string[]; cat: string; sub: string; note: string }[] = [
    { keys: ["tap", "leak", "drip", "water", "pipe", "nal"], cat: "plumbing", sub: "Tap repair", note: "Sounds like a water leakage issue." },
    { keys: ["drain", "block", "sink", "clog"], cat: "plumbing", sub: "Sink / drain blockage", note: "Drainage blockage reported." },
    { keys: ["fan", "noise", "ceiling fan"], cat: "electrical", sub: "Fan repair", note: "A fan inspection is recommended." },
    { keys: ["light", "bulb", "tube"], cat: "electrical", sub: "Light installation", note: "Lighting work identified." },
    { keys: ["switch", "socket", "shock", "spark", "wiring", "current"], cat: "electrical", sub: "Switch / socket repair", note: "Please switch off the mains and wait for a verified electrician." },
    { keys: ["clean", "dust", "sweep", "mop"], cat: "cleaning", sub: "Home cleaning", note: "Cleaning service matched." },
    { keys: ["door", "furniture", "chair", "table", "wood", "cupboard"], cat: "carpentry", sub: "Furniture repair", note: "Carpentry work identified." },
    { keys: ["paint", "wall colour", "wall color", "whitewash"], cat: "painting", sub: "Wall painting", note: "Painting work identified." },
    { keys: ["garden", "plant", "lawn", "grass"], cat: "gardening", sub: "Garden maintenance", note: "Gardening service matched." },
    { keys: ["fridge", "washing machine", "ac", "cooler", "mixer", "appliance"], cat: "appliance", sub: "Basic appliance repair", note: "Appliance technician needed." },
    { keys: ["elder", "old", "patient", "care", "grandmother", "grandfather"], cat: "caregiving", sub: "Elder care visit", note: "Caregiving support matched. This is non-medical assistance only." },
    { keys: ["driver", "drive", "car", "trip"], cat: "driving", sub: "Local driver (half day)", note: "Driving service matched." },
  ];
  const hit = rules.find((r) => r.keys.some((k) => t.includes(k)));
  if (!hit) return null;
  const cat = categories.find((c) => c.id === hit.cat)!;
  const sub = cat.subservices.find((s) => s.name === hit.sub) ?? cat.subservices[0]!;
  return { category: cat, sub, note: hit.note };
}

export function fairWage(amount: number, range: [number, number]) {
  if (amount < range[0]) return { ok: false, text: "Price appears below the recommended worker wage range." };
  if (amount > range[1] * 1.5) return { ok: false, text: "Price is well above the recommended range — please review." };
  return { ok: true, text: "Worker earning is within the recommended fair wage range." };
}
