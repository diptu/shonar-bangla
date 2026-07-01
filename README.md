<div align="center">

<img src="docs/assets/banner.svg" alt="Shonar Bangla — ASCII wordmark on a Bangladesh-flag-styled banner" width="820"/>

*A high-performance, open-source dashboard that maps Bangladesh's socioeconomic growth and infrastructure milestones through an interactive, data-driven interface.*

<br/>

[![Build](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-Yes-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ff69b4?style=for-the-badge)](CONTRIBUTING.md)
[![Made with Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)](#)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](#)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](#)

<br/>

[**Live Demo**](#) · [**Report Bug**](../../issues) · [**Request Feature**](../../issues) · [**Docs**](#)

</div>

<br/>

---

## 📸 Overview

<div align="center">

> _Drop a 10–15s GIF here of the map interaction — this is the single highest-impact addition to this README._
> _Record with [LICEcap](https://www.cockos.com/licecap/) or [Peek](https://github.com/phw/peek), then embed it below:_

```md
![Shonar Bangla Demo](docs/assets/demo.gif)
```

</div>

---

## 🚀 Key Features

| | |
|---|---|
| 🗺️ **Geospatial Insights** | Real-time map views of developmental progress across all 64 districts. |
| 📊 **Data-Driven** | Centralized tracking of key national performance indicators (KPIs). |
| ⚡ **Modern Stack** | Built for scalability using a T3-inspired, MERN-style architecture. |
| 🌐 **Open Access** | Transparent, community-driven data for researchers and policymakers. |

---

## 🛠 Tech Stack

<div align="center">

| Layer | Technology |
|:---|:---|
| **Frontend** | Next.js + TypeScript + TailwindCSS |
| **Backend** | NestJS + TypeScript |
| **Database** | MongoDB |
| **ORM** | Prisma |
| **Maps** | Leaflet |

</div>

---

## 📦 Architecture

```
.
├── app/
│   ├── client/      # Next.js (TailwindCSS + Leaflet)
│   └── server/      # NestJS (REST API)
├── packages/
│   └── database/    # Shared Prisma schema & types
└── ...
```

---

## 🚀 Quick Start

**1. Clone the repo**

```bash
git clone https://github.com/yourusername/shonar-bangla.git
cd shonar-bangla
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment**

Rename `.env.example` to `.env` and provide your `DATABASE_URL`.

```bash
cp .env.example .env
```

**4. Launch**

```bash
npm run dev
```

The app should now be running at `http://localhost:3000` 🎉

---

## 🗺️ Roadmap

- [x] Interactive district-level map
- [x] Core KPI dashboard
- [ ] Historical trend comparisons (time-series slider)
- [ ] Public API for researchers
- [ ] Mobile-first companion view

---

## 🤝 Contribution

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) to get started.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

Made with ❤️ for 🇧🇩

<sub>If this project helped you, consider giving it a ⭐</sub>

</div>
