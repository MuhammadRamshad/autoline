export interface CategoryTariff {
  category: string;
  group: "2 wheeler" | "car" | "pickup" | "traveller" | "other";
  price: number; // 0 if no amount
  order: number;
}

export const INITIAL_VEHICLE_CATEGORIES: CategoryTariff[] = [
  // 2 wheeler
  { category: "2 Wheeler - Bike Normal", group: "2 wheeler", price: 100, order: 1 },
  { category: "2 Wheeler - Bike/Scooter", group: "2 wheeler", price: 200, order: 2 },
  { category: "2 Wheeler - Bullet", group: "2 wheeler", price: 250, order: 3 },

  // car
  { category: "Car - Normal", group: "car", price: 100, order: 4 },
  { category: "Car - Body Wash (5 Seater)", group: "car", price: 300, order: 5 },
  { category: "Car - Body Wash (7 Seater)", group: "car", price: 350, order: 6 },
  { category: "Car - Body + Vacuum (5 Seater)", group: "car", price: 350, order: 7 },
  { category: "Car - Body + Vacuum (7 Seater)", group: "car", price: 400, order: 8 },
  { category: "Car - Full Service (5 Seater)", group: "car", price: 500, order: 9 },
  { category: "Car - Full Service (7 Seater)", group: "car", price: 600, order: 10 },

  // pickup
  { category: "Pickup", group: "pickup", price: 0, order: 11 },

  // traveller
  { category: "Traveller", group: "traveller", price: 1000, order: 12 },
];
