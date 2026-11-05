# Autoline Car Wash & Detailing Operating System

Production-ready Car Wash Center Management system built with **Next.js (App Router)**, **MongoDB Atlas**, **Tailwind CSS**, and comprehensive Indian vehicle & RTO databases.

---

## 🚀 Key Features

1. **Admin Control Center (`/admin`)**:
   - Secure login using credentials: `admin` / `admin`.
   - **Tariff & Category Pricing Management**: Add new vehicle categories or modify prices for **Basic Wash**, **Wash + Vacuum**, and **Full Deep Cleaning** in real time.
   - **Executive Financial Stats**: Live KPI counters for Total Revenue, Total Vehicles Washed, UPI/QR collections, and Cash collections.
   - **Report Downloads**:
     - **Excel Export (.xlsx)**: Complete multi-column spreadsheet of wash records, payment channels, and RTO info.
     - **PDF Statement**: Polished landscape PDF executive report formatted with auto-calculated summaries.
   - **Filters & Search**: Filter by specific date, category, payment mode (UPI, Cash, Card, Credit), or search by Vehicle Number and Phone Number.

2. **Shopkeeper Counter (`/shop`)**:
   - **Fast Vehicle Entry**: Enter registration number (e.g. `MH12AB1234`, `DL01A1234`, `KL07CD5678`), owner phone, and payment mode.
   - **Parivahan / Vahan RTO Integration (`/api/parivahan`)**: Instant one-click check fetching State RTO office, Fuel type, and verification status. Supports any external live API key via `VEHICLE_API_KEY` with automatic intelligent fallback.
   - **Indian Vehicle Catalog**: Pre-populated database with 70+ top vehicles sold in India (Maruti, Hyundai, Tata, Mahindra, Toyota, Kia, Honda, Bajaj, Royal Enfield, BMW, Audi, etc.) with instant auto-completion and automatic category mapping.
   - **Dynamic Price Calculation**: Auto-adjusts pricing based on vehicle category and package selected.
   - **Thermal Digital Receipt**: Shows an instant summary receipt with one-click print functionality for thermal billing printers.
   - **Live Counter Log**: Shows the last 5 serviced vehicles directly from MongoDB.

---

## 🛠️ Environment Configuration

Configured in [`.env.local`](file:///c:/Users/progr/Downloads/Autoline%20car%20wash/.env.local):

```env
MONGODB_URI=mongodb+srv://mailautolinecarwash_db_user:gPWVRF9V4pmTRVfM@servicecenter.rvo5nbe.mongodb.net/autoline_carwash?retryWrites=true&w=majority
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
NEXT_PUBLIC_APP_NAME="Autoline Car Wash"
```

---

## 💻 Running the Application

### Development Server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### Production Server:
```bash
npm run build
npm start
```

---

## 🔐 Credentials

- **Admin Route**: `/admin`
- **Username**: `admin`
- **Password**: `admin`
- **Shopkeeper Counter**: `/shop`
