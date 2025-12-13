<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Back2Use Backend - A sustainable reusable container management system built with NestJS, MongoDB, and TypeScript.

## Features

- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 🏢 **Business Management** - Multi-tenant business profiles with geospatial search
- 📦 **Product Management** - Reusable container inventory tracking with QR codes
- 💰 **Wallet & Payments** - Integrated payment system with VNPay and MoMo
- ♻️ **Eco Rewards** - Gamification with eco-points and leaderboards
- 🎫 **Voucher System** - Discount and reward voucher management
- 📊 **Analytics** - CO2 reduction tracking and usage statistics
- 📱 **Real-time Notifications** - WebSocket-based notification system

## Tech Stack

- **Framework:** NestJS 11
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** Passport JWT, Google OAuth, Facebook OAuth
- **Payments:** VNPay, MoMo
- **File Storage:** Cloudinary
- **Email:** Nodemailer
- **Real-time:** Socket.io
- **Documentation:** Swagger/OpenAPI

## Project setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration. See `.env.example` for all available options.

### 3. Database Setup

Make sure MongoDB is running, then seed the database:

```bash
# Seed database with test data
npm run seed

# Or clean database first, then seed
npm run cleanup
npm run seed
```

See [scripts/README.md](scripts/README.md) for detailed database setup instructions.

### 4. Start the application

```bash
$ npm install
```

### 4. Start the application

```bash
npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Database Scripts

```bash
# Seed database with test data
npm run seed

# Clean/reset database
npm run cleanup

# Clean but keep users
npm run cleanup -- --keep-users

# Clean but keep users and settings
npm run cleanup -- --keep-users --keep-settings
```

For more details, see [scripts/README.md](scripts/README.md) or [scripts/QUICKSTART.md](scripts/QUICKSTART.md).

## Test Credentials

After seeding the database, you can login with:

| Role     | Email               | Password    |
| -------- | ------------------- | ----------- |
| Admin    | admin@back2use.com  | password123 |
| Customer | john@example.com    | password123 |
| Business | owner@greencafe.com | password123 |

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## API Documentation

Once the application is running, access the Swagger documentation at:

```
http://localhost:3000/api
```

## Project Structure

```
src/
├── common/              # Shared utilities, guards, decorators
│   ├── constants/       # Enums and constants
│   ├── decorators/      # Custom decorators
│   ├── guards/          # Auth and role guards
│   └── utils/           # Helper functions
├── config/              # Configuration files
├── infrastructure/      # External services (Cloudinary, Email, Payments)
├── modules/             # Feature modules
│   ├── auth/            # Authentication
│   ├── users/           # User management
│   ├── businesses/      # Business profiles
│   ├── products/        # Product inventory
│   ├── vouchers/        # Voucher system
│   ├── wallets/         # Wallet management
│   └── ...              # Other modules
└── main.ts              # Application entry point

scripts/
├── seed.ts              # Database seeding script
├── cleanup.ts           # Database cleanup script
├── README.md            # Scripts documentation
└── QUICKSTART.md        # Quick start guide
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
