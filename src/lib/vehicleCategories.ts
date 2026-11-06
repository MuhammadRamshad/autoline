export interface CategoryTariff {
  name: string;        // display name e.g. "Bike Normal"
  category: string;    // full identifier / value stored e.g. "Bike Normal" or "Car - Body Wash (5 Seater)"
  group: "2 wheeler" | "car" | "pickup" | "traveller" | "other";
  groupLabel: string;  // e.g. "2 WHEELER", "CAR"
  price: number;       // 0 for no amount
  order: number;
}

export const INITIAL_VEHICLE_CATEGORIES: CategoryTariff[] = [
  // 2 wheeler
  { name: "Bike Normal", category: "Bike Normal", group: "2 wheeler", groupLabel: "2 WHEELER", price: 100, order: 1 },
  { name: "Bike / Scooter", category: "Bike / Scooter", group: "2 wheeler", groupLabel: "2 WHEELER", price: 200, order: 2 },
  { name: "Bullet", category: "Bullet", group: "2 wheeler", groupLabel: "2 WHEELER", price: 250, order: 3 },

  // car
  { name: "Normal", category: "Car - Normal", group: "car", groupLabel: "CAR", price: 100, order: 4 },
  { name: "Body Wash (5 Seater)", category: "Car - Body Wash (5 Seater)", group: "car", groupLabel: "CAR", price: 300, order: 5 },
  { name: "Body Wash (7 Seater)", category: "Car - Body Wash (7 Seater)", group: "car", groupLabel: "CAR", price: 350, order: 6 },
  { name: "Body + Vacuum (5 Seater)", category: "Car - Body + Vacuum (5 Seater)", group: "car", groupLabel: "CAR", price: 350, order: 7 },
  { name: "Body + Vacuum (7 Seater)", category: "Car - Body + Vacuum (7 Seater)", group: "car", groupLabel: "CAR", price: 400, order: 8 },
  { name: "Full Service (5 Seater)", category: "Car - Full Service (5 Seater)", group: "car", groupLabel: "CAR", price: 500, order: 9 },
  { name: "Full Service (7 Seater)", category: "Car - Full Service (7 Seater)", group: "car", groupLabel: "CAR", price: 600, order: 10 },

  // pickup
  { name: "Pickup", category: "Pickup", group: "pickup", groupLabel: "PICKUP", price: 0, order: 11 },

  // traveller
  { name: "Traveller", category: "Traveller", group: "traveller", groupLabel: "TRAVELLER", price: 1000, order: 12 },
];

export const OLD_OBSOLETE_CATEGORIES = [
  "Compact SUV (5 Seater)",
  "Hatchback (5 Seater)",
  "SUV / MUV (7 Seater)",
  "Sedan (5 Seater)",
  "Auto / Commercial",
  "Luxury / Large Vehicle",
  // Old prefixed variants if any
  "2 Wheeler - Bike Normal",
  "2 Wheeler - Bike/Scooter",
  "2 Wheeler - Bullet",
];
