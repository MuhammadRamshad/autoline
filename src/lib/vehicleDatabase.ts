export interface IndianVehicleModel {
  make: string;
  model: string;
  category: "Bike / Scooter" | "Hatchback (5 Seater)" | "Sedan (5 Seater)" | "Compact SUV (5 Seater)" | "SUV / MUV (7 Seater)" | "Luxury / Large Vehicle" | "Auto / Commercial";
  bodyType?: string;
  defaultWashPrice: number;
}

export const INDIAN_VEHICLES_DATABASE: IndianVehicleModel[] = [
  // --- Two Wheelers ---
  { make: "Hero", model: "Splendor Plus", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "Hero", model: "HF Deluxe", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "Hero", model: "Glamour", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "Hero", model: "Passion Pro", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "Hero", model: "Xpulse 200", category: "Bike / Scooter", defaultWashPrice: 180 },
  { make: "Hero", model: "Maestro Edge", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "Hero", model: "Destini 125", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "Hero", model: "Pleasure+", category: "Bike / Scooter", defaultWashPrice: 150 },

  { make: "Honda", model: "Activa 6G / 125", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "Honda", model: "Dio / Dio 125", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "Honda", model: "Shine 100 / 125", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "Honda", model: "SP 125 / 160", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "Honda", model: "Unicorn", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "Honda", model: "Hornet 2.0", category: "Bike / Scooter", defaultWashPrice: 180 },
  { make: "Honda", model: "H'ness CB350", category: "Bike / Scooter", defaultWashPrice: 200 },
  { make: "Honda", model: "CB350RS", category: "Bike / Scooter", defaultWashPrice: 200 },

  { make: "Bajaj", model: "Pulsar 125 / 150", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "Bajaj", model: "Pulsar NS200 / RS200", category: "Bike / Scooter", defaultWashPrice: 180 },
  { make: "Bajaj", model: "Pulsar N160 / N250", category: "Bike / Scooter", defaultWashPrice: 180 },
  { make: "Bajaj", model: "Platina 100 / 110", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "Bajaj", model: "CT 110X", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "Bajaj", model: "Avenger 160 / 220 Cruise", category: "Bike / Scooter", defaultWashPrice: 200 },
  { make: "Bajaj", model: "Dominar 250 / 400", category: "Bike / Scooter", defaultWashPrice: 220 },
  { make: "Bajaj", model: "Chetak EV", category: "Bike / Scooter", defaultWashPrice: 150 },

  { make: "TVS", model: "Jupiter 110 / 125", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "TVS", model: "Apache RTR 160 / 200 4V", category: "Bike / Scooter", defaultWashPrice: 180 },
  { make: "TVS", model: "Apache RR 310", category: "Bike / Scooter", defaultWashPrice: 220 },
  { make: "TVS", model: "Raider 125", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "TVS", model: "Ntorq 125", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "TVS", model: "Sport / Star City+", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "TVS", model: "XL100 Heavy Duty", category: "Bike / Scooter", defaultWashPrice: 120 },
  { make: "TVS", model: "iQube EV", category: "Bike / Scooter", defaultWashPrice: 150 },

  { make: "Royal Enfield", model: "Classic 350", category: "Bike / Scooter", defaultWashPrice: 200 },
  { make: "Royal Enfield", model: "Bullet 350", category: "Bike / Scooter", defaultWashPrice: 200 },
  { make: "Royal Enfield", model: "Hunter 350", category: "Bike / Scooter", defaultWashPrice: 180 },
  { make: "Royal Enfield", model: "Meteor 350", category: "Bike / Scooter", defaultWashPrice: 200 },
  { make: "Royal Enfield", model: "Himalayan 450", category: "Bike / Scooter", defaultWashPrice: 250 },
  { make: "Royal Enfield", model: "Interceptor 650", category: "Bike / Scooter", defaultWashPrice: 250 },
  { make: "Royal Enfield", model: "Continental GT 650", category: "Bike / Scooter", defaultWashPrice: 250 },
  { make: "Royal Enfield", model: "Super Meteor 650", category: "Bike / Scooter", defaultWashPrice: 250 },

  { make: "Yamaha", model: "FZ-S / FZ Fi", category: "Bike / Scooter", defaultWashPrice: 180 },
  { make: "Yamaha", model: "MT-15 V2", category: "Bike / Scooter", defaultWashPrice: 180 },
  { make: "Yamaha", model: "YZF R15 V4", category: "Bike / Scooter", defaultWashPrice: 200 },
  { make: "Yamaha", model: "RayZR 125", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "Yamaha", model: "Aerox 155", category: "Bike / Scooter", defaultWashPrice: 180 },

  { make: "Suzuki", model: "Access 125", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "Suzuki", model: "Burgman Street 125", category: "Bike / Scooter", defaultWashPrice: 160 },
  { make: "Suzuki", model: "Gixxer / Gixxer SF 250", category: "Bike / Scooter", defaultWashPrice: 180 },
  { make: "Suzuki", model: "V-Strom SX 250", category: "Bike / Scooter", defaultWashPrice: 220 },

  { make: "KTM", model: "Duke 125 / 200 / 250 / 390", category: "Bike / Scooter", defaultWashPrice: 200 },
  { make: "KTM", model: "RC 200 / 390", category: "Bike / Scooter", defaultWashPrice: 220 },
  { make: "KTM", model: "Adventure 250 / 390", category: "Bike / Scooter", defaultWashPrice: 250 },

  { make: "Ola Electric", model: "S1 Pro / S1 Air / S1 X", category: "Bike / Scooter", defaultWashPrice: 150 },
  { make: "Ather", model: "450X / 450S / Rizta", category: "Bike / Scooter", defaultWashPrice: 150 },

  // --- Hatchback (5 Seater) ---
  { make: "Maruti Suzuki", model: "Alto 800 / K10", category: "Hatchback (5 Seater)", defaultWashPrice: 350 },
  { make: "Maruti Suzuki", model: "WagonR", category: "Hatchback (5 Seater)", defaultWashPrice: 350 },
  { make: "Maruti Suzuki", model: "Swift", category: "Hatchback (5 Seater)", defaultWashPrice: 380 },
  { make: "Maruti Suzuki", model: "Baleno", category: "Hatchback (5 Seater)", defaultWashPrice: 380 },
  { make: "Maruti Suzuki", model: "Celerio", category: "Hatchback (5 Seater)", defaultWashPrice: 350 },
  { make: "Maruti Suzuki", model: "Ignis", category: "Hatchback (5 Seater)", defaultWashPrice: 350 },
  { make: "Maruti Suzuki", model: "S-Presso", category: "Hatchback (5 Seater)", defaultWashPrice: 350 },

  { make: "Hyundai", model: "Grand i10 Nios", category: "Hatchback (5 Seater)", defaultWashPrice: 380 },
  { make: "Hyundai", model: "i20 / i20 N Line", category: "Hatchback (5 Seater)", defaultWashPrice: 400 },
  { make: "Hyundai", model: "Santro (Old/New)", category: "Hatchback (5 Seater)", defaultWashPrice: 350 },

  { make: "Tata", model: "Tiago / Tiago EV", category: "Hatchback (5 Seater)", defaultWashPrice: 380 },
  { make: "Tata", model: "Altroz / Altroz EV", category: "Hatchback (5 Seater)", defaultWashPrice: 400 },

  { make: "Renault", model: "Kwid", category: "Hatchback (5 Seater)", defaultWashPrice: 350 },
  { make: "Citroen", model: "C3 / eC3", category: "Hatchback (5 Seater)", defaultWashPrice: 380 },
  { make: "Toyota", model: "Glanza", category: "Hatchback (5 Seater)", defaultWashPrice: 380 },
  { make: "Volkswagen", model: "Polo (Legacy)", category: "Hatchback (5 Seater)", defaultWashPrice: 400 },

  // --- Sedan (5 Seater) ---
  { make: "Maruti Suzuki", model: "Dzire", category: "Sedan (5 Seater)", defaultWashPrice: 420 },
  { make: "Maruti Suzuki", model: "Ciaz", category: "Sedan (5 Seater)", defaultWashPrice: 450 },

  { make: "Hyundai", model: "Aura", category: "Sedan (5 Seater)", defaultWashPrice: 420 },
  { make: "Hyundai", model: "Verna", category: "Sedan (5 Seater)", defaultWashPrice: 450 },

  { make: "Honda", model: "Amaze", category: "Sedan (5 Seater)", defaultWashPrice: 420 },
  { make: "Honda", model: "City (4th/5th Gen)", category: "Sedan (5 Seater)", defaultWashPrice: 450 },

  { make: "Tata", model: "Tigor / Tigor EV", category: "Sedan (5 Seater)", defaultWashPrice: 420 },

  { make: "Volkswagen", model: "Virtus / Vento", category: "Sedan (5 Seater)", defaultWashPrice: 450 },
  { make: "Skoda", model: "Slavia / Rapid / Octavia", category: "Sedan (5 Seater)", defaultWashPrice: 450 },

  // --- Compact SUV & Cross (5 Seater) ---
  { make: "Tata", model: "Punch / Punch EV", category: "Compact SUV (5 Seater)", defaultWashPrice: 450 },
  { make: "Tata", model: "Nexon / Nexon EV", category: "Compact SUV (5 Seater)", defaultWashPrice: 480 },
  { make: "Tata", model: "Curvv", category: "Compact SUV (5 Seater)", defaultWashPrice: 500 },
  { make: "Tata", model: "Harrier (5 Seater)", category: "Compact SUV (5 Seater)", defaultWashPrice: 550 },

  { make: "Hyundai", model: "Exter", category: "Compact SUV (5 Seater)", defaultWashPrice: 450 },
  { make: "Hyundai", model: "Venue / Venue N Line", category: "Compact SUV (5 Seater)", defaultWashPrice: 480 },
  { make: "Hyundai", model: "Creta / Creta N Line", category: "Compact SUV (5 Seater)", defaultWashPrice: 500 },

  { make: "Maruti Suzuki", model: "Brezza", category: "Compact SUV (5 Seater)", defaultWashPrice: 480 },
  { make: "Maruti Suzuki", model: "Fronx", category: "Compact SUV (5 Seater)", defaultWashPrice: 450 },
  { make: "Maruti Suzuki", model: "Grand Vitara", category: "Compact SUV (5 Seater)", defaultWashPrice: 500 },
  { make: "Maruti Suzuki", model: "Jimny", category: "Compact SUV (5 Seater)", defaultWashPrice: 480 },

  { make: "Kia", model: "Sonet", category: "Compact SUV (5 Seater)", defaultWashPrice: 480 },
  { make: "Kia", model: "Seltos", category: "Compact SUV (5 Seater)", defaultWashPrice: 500 },

  { make: "Mahindra", model: "XUV 3XO / XUV300", category: "Compact SUV (5 Seater)", defaultWashPrice: 480 },
  { make: "Mahindra", model: "Thar / Thar Roxx", category: "Compact SUV (5 Seater)", defaultWashPrice: 550 },
  { make: "Mahindra", model: "XUV400 EV", category: "Compact SUV (5 Seater)", defaultWashPrice: 480 },
  { make: "Mahindra", model: "Bolero Neo (5+2)", category: "Compact SUV (5 Seater)", defaultWashPrice: 500 },

  { make: "Toyota", model: "Urban Cruiser Taisor", category: "Compact SUV (5 Seater)", defaultWashPrice: 450 },
  { make: "Toyota", model: "Urban Cruiser Hyryder", category: "Compact SUV (5 Seater)", defaultWashPrice: 500 },

  { make: "Skoda", model: "Kushaq / Kylaq", category: "Compact SUV (5 Seater)", defaultWashPrice: 480 },
  { make: "Volkswagen", model: "Taigun", category: "Compact SUV (5 Seater)", defaultWashPrice: 480 },
  { make: "MG", model: "Astor / ZS EV / Windsor EV", category: "Compact SUV (5 Seater)", defaultWashPrice: 500 },
  { make: "Nissan", model: "Magnite", category: "Compact SUV (5 Seater)", defaultWashPrice: 450 },
  { make: "Renault", model: "Kiger", category: "Compact SUV (5 Seater)", defaultWashPrice: 450 },

  // --- SUV / MUV (7 Seater) ---
  { make: "Mahindra", model: "Scorpio-N / Scorpio Classic", category: "SUV / MUV (7 Seater)", defaultWashPrice: 600 },
  { make: "Mahindra", model: "XUV700 (7 Seater)", category: "SUV / MUV (7 Seater)", defaultWashPrice: 600 },
  { make: "Mahindra", model: "Bolero", category: "SUV / MUV (7 Seater)", defaultWashPrice: 550 },
  { make: "Mahindra", model: "Marazzo", category: "SUV / MUV (7 Seater)", defaultWashPrice: 550 },

  { make: "Tata", model: "Safari", category: "SUV / MUV (7 Seater)", defaultWashPrice: 600 },

  { make: "Maruti Suzuki", model: "Ertiga", category: "SUV / MUV (7 Seater)", defaultWashPrice: 550 },
  { make: "Maruti Suzuki", model: "XL6", category: "SUV / MUV (7 Seater)", defaultWashPrice: 550 },
  { make: "Maruti Suzuki", model: "Invicto", category: "SUV / MUV (7 Seater)", defaultWashPrice: 650 },

  { make: "Toyota", model: "Innova Crysta", category: "SUV / MUV (7 Seater)", defaultWashPrice: 650 },
  { make: "Toyota", model: "Innova Hycross", category: "SUV / MUV (7 Seater)", defaultWashPrice: 650 },
  { make: "Toyota", model: "Fortuner / Legender", category: "SUV / MUV (7 Seater)", defaultWashPrice: 700 },
  { make: "Toyota", model: "Rumion", category: "SUV / MUV (7 Seater)", defaultWashPrice: 550 },

  { make: "Hyundai", model: "Alcazar", category: "SUV / MUV (7 Seater)", defaultWashPrice: 580 },
  { make: "Kia", model: "Carens", category: "SUV / MUV (7 Seater)", defaultWashPrice: 580 },
  { make: "Kia", model: "Carnival", category: "SUV / MUV (7 Seater)", defaultWashPrice: 750 },

  { make: "MG", model: "Hector Plus (6/7 Seater)", category: "SUV / MUV (7 Seater)", defaultWashPrice: 600 },
  { make: "MG", model: "Gloster", category: "SUV / MUV (7 Seater)", defaultWashPrice: 750 },
  { make: "Renault", model: "Triber", category: "SUV / MUV (7 Seater)", defaultWashPrice: 500 },

  // --- Luxury / Large Vehicle ---
  { make: "BMW", model: "3 Series / 5 Series / 7 Series", category: "Luxury / Large Vehicle", defaultWashPrice: 800 },
  { make: "BMW", model: "X1 / X3 / X5 / X7", category: "Luxury / Large Vehicle", defaultWashPrice: 900 },
  { make: "Mercedes-Benz", model: "C-Class / E-Class / S-Class", category: "Luxury / Large Vehicle", defaultWashPrice: 850 },
  { make: "Mercedes-Benz", model: "GLA / GLC / GLE / GLS", category: "Luxury / Large Vehicle", defaultWashPrice: 950 },
  { make: "Audi", model: "A4 / A6 / Q3 / Q5 / Q7", category: "Luxury / Large Vehicle", defaultWashPrice: 850 },
  { make: "Land Rover", model: "Defender / Range Rover Evoque / Sport", category: "Luxury / Large Vehicle", defaultWashPrice: 1000 },
  { make: "Volvo", model: "XC40 / XC60 / XC90", category: "Luxury / Large Vehicle", defaultWashPrice: 900 },
  { make: "Jeep", model: "Compass / Meridian / Wrangler", category: "Luxury / Large Vehicle", defaultWashPrice: 750 },

  // --- Auto, 3-Wheeler & Commercial Light Vehicles ---
  // Autos / 3-Wheelers (Passenger & Cargo)
  { make: "Bajaj", model: "RE Compact Auto Rickshaw", category: "Auto / Commercial", defaultWashPrice: 200 },
  { make: "Bajaj", model: "RE Maxima Auto (Passenger)", category: "Auto / Commercial", defaultWashPrice: 220 },
  { make: "Bajaj", model: "Maxima Cargo / Delivery", category: "Auto / Commercial", defaultWashPrice: 250 },
  { make: "Bajaj", model: "Maxima Z", category: "Auto / Commercial", defaultWashPrice: 220 },
  { make: "Bajaj", model: "Qute (Quadricycle)", category: "Auto / Commercial", defaultWashPrice: 250 },

  { make: "Piaggio", model: "Ape City / City Plus (Auto Rickshaw)", category: "Auto / Commercial", defaultWashPrice: 200 },
  { make: "Piaggio", model: "Ape DX / Ape Auto", category: "Auto / Commercial", defaultWashPrice: 220 },
  { make: "Piaggio", model: "Ape Xtra LDX (Cargo / Goods)", category: "Auto / Commercial", defaultWashPrice: 250 },
  { make: "Piaggio", model: "Ape E-City / E-Xtra EV", category: "Auto / Commercial", defaultWashPrice: 220 },

  { make: "Mahindra", model: "Alfa Passenger Auto", category: "Auto / Commercial", defaultWashPrice: 200 },
  { make: "Mahindra", model: "Alfa Plus Cargo Auto", category: "Auto / Commercial", defaultWashPrice: 250 },
  { make: "Mahindra", model: "Treo Auto Rickshaw (Electric EV)", category: "Auto / Commercial", defaultWashPrice: 200 },
  { make: "Mahindra", model: "Treo Zor (Electric Cargo)", category: "Auto / Commercial", defaultWashPrice: 250 },
  { make: "Mahindra", model: "Zor Grand EV", category: "Auto / Commercial", defaultWashPrice: 250 },

  { make: "TVS", model: "King Deluxe Auto Rickshaw", category: "Auto / Commercial", defaultWashPrice: 200 },
  { make: "TVS", model: "King Duramax (Passenger)", category: "Auto / Commercial", defaultWashPrice: 220 },
  { make: "TVS", model: "King Kargo (Goods 3-Wheeler)", category: "Auto / Commercial", defaultWashPrice: 250 },

  { make: "Atul", model: "Gem Paxx Auto Rickshaw", category: "Auto / Commercial", defaultWashPrice: 200 },
  { make: "Atul", model: "Gem Cargo / Shakti", category: "Auto / Commercial", defaultWashPrice: 250 },
  { make: "Atul", model: "Rik Passenger Auto", category: "Auto / Commercial", defaultWashPrice: 200 },

  // Mini Trucks, Small Commercial & 4-Wheeler Tempos
  { make: "Mahindra", model: "Jeeto (Jeeto Plus / Strong / S6 16)", category: "Auto / Commercial", defaultWashPrice: 350 },
  { make: "Mahindra", model: "Supro Profit Truck Mini / Maxi", category: "Auto / Commercial", defaultWashPrice: 400 },
  { make: "Mahindra", model: "Supro Van (Passenger)", category: "Auto / Commercial", defaultWashPrice: 420 },
  { make: "Mahindra", model: "Bolero Maxi Truck / Camper", category: "Auto / Commercial", defaultWashPrice: 500 },
  { make: "Mahindra", model: "Bolero Pik-Up (1.3T / 1.7T / Extra Long)", category: "Auto / Commercial", defaultWashPrice: 550 },
  { make: "Mahindra", model: "Maxx City Pikup / HD", category: "Auto / Commercial", defaultWashPrice: 550 },

  { make: "Tata", model: "Magic Iris (Passenger Mini Van)", category: "Auto / Commercial", defaultWashPrice: 320 },
  { make: "Tata", model: "Magic Gold / Magic Express", category: "Auto / Commercial", defaultWashPrice: 420 },
  { make: "Tata", model: "Magic Mantra", category: "Auto / Commercial", defaultWashPrice: 420 },
  { make: "Tata", model: "Ace (Chota Hathi)", category: "Auto / Commercial", defaultWashPrice: 380 },
  { make: "Tata", model: "Ace Gold (Petrol / Diesel / CNG)", category: "Auto / Commercial", defaultWashPrice: 380 },
  { make: "Tata", model: "Ace EV", category: "Auto / Commercial", defaultWashPrice: 380 },
  { make: "Tata", model: "Ace Zip", category: "Auto / Commercial", defaultWashPrice: 350 },
  { make: "Tata", model: "Intra V10 / V20 / V30 / V50", category: "Auto / Commercial", defaultWashPrice: 450 },
  { make: "Tata", model: "Yodha Pickup (1200 / 1700)", category: "Auto / Commercial", defaultWashPrice: 550 },

  { make: "Maruti Suzuki", model: "Super Carry (Mini Truck)", category: "Auto / Commercial", defaultWashPrice: 380 },
  { make: "Maruti Suzuki", model: "Eeco (Passenger / Cargo)", category: "Auto / Commercial", defaultWashPrice: 420 },

  { make: "Ashok Leyland", model: "Dost+ / Dost Strong", category: "Auto / Commercial", defaultWashPrice: 480 },
  { make: "Ashok Leyland", model: "Bada Dost (i2 / i3 / i4)", category: "Auto / Commercial", defaultWashPrice: 520 },
  { make: "Ashok Leyland", model: "Bada Dost EV", category: "Auto / Commercial", defaultWashPrice: 520 },

  { make: "Force Motors", model: "Trax Cruiser / Toofan", category: "Auto / Commercial", defaultWashPrice: 650 },
  { make: "Force Motors", model: "Urbania (Van / Tempo)", category: "Auto / Commercial", defaultWashPrice: 850 },
  { make: "Force Motors", model: "Traveller 3050 / 3350 / 4020", category: "Auto / Commercial", defaultWashPrice: 900 },

  { make: "Isuzu", model: "D-Max / V-Cross", category: "Auto / Commercial", defaultWashPrice: 650 },
  { make: "Isuzu", model: "S-Cab Commercial Pickup", category: "Auto / Commercial", defaultWashPrice: 600 },
];
