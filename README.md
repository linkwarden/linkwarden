<div align="center">
<h1>
LinkWarden

<sub>A place for your useful links.</sub>

<img src="assets/LinkWarden.png" alt="LinkWarden.png" width="500px"/>

<a href="https://twitter.com/Daniel31X13" target="_blank" rel="noopener noreferrer"><img alt="Twitter Follow" src="https://img.shields.io/twitter/follow/Daniel31X13?label=twitter&amp;style=social"></a>

![GitHub](https://img.shields.io/github/license/daniel31x13/link-warden?style=flat-square) ![GitHub top language](https://img.shields.io/github/languages/top/daniel31x13/link-warden?style=flat-square) ![GitHub commit activity](https://img.shields.io/github/commit-activity/m/daniel31x13/link-warden?style=flat-square) ![GitHub last commit](https://img.shields.io/github/last-commit/daniel31x13/link-warden?style=flat-square) ![Netlify](https://img.shields.io/netlify/31890116-669c-4b1c-844e-fa427503d8bf?style=flat-square) ![GitHub Repo stars](https://img.shields.io/github/stars/daniel31x13/link-warden?style=flat-square)

</h1>

[Demo (v1.0.0)](https://linkwarden.netlify.app/) | [Intro & Motivation](https://github.com/Daniel31x13/link-warden#intro--motivation) | [Features](https://github.com/Daniel31x13/link-warden#features) | [Roadmap](https://github.com/Daniel31x13/link-warden/wiki#project-roadmap) | [Setup](https://github.com/Daniel31x13/link-warden#setup) | [Development](https://github.com/Daniel31x13/link-warden#linkwarden-development)

</div>

## Intro & Motivation

**LinkWarden is a self-hosted, open-source bookmark + archive manager to collect, and save websites for offline use.**

The objective is to have a self-hosted place to keep useful links in one place, and since useful links can go away (see the inevitability of [Link Rot](https://www.howtogeek.com/786227/what-is-link-rot-and-how-does-it-threaten-the-web/)), LinkWarden also saves a copy of the link as screenshot and PDF.

## Features

* 📷 Auto-capture a screenshot and PDF from each website.

* 🔥 Sleek, minimalist design.

* 🌤 Dark/Light mode support.

* ↔️ Responsive design.

* 🔎 Search, filter and sorting functionality.

* 🚀 Lazy loading (for better performance).

* 🏷 Set multiple tags to each link.

* 🗂 Assign each link to a collection where we can further group links.

**Also take a look at our planned features in the [project roadmap section](https://github.com/Daniel31x13/link-warden/wiki#project-roadmap).**

## Installation

### Using Docker Compose V2 (Recommended)

1. Make sure docker is installed.

2. Clone this repository.

3. Head to the main folder and run `docker compose up -d`.

The app will be deployed on port 3000.

### Configuration
To configure the app create a `.env` file (in the main folder), here are the available variables:
```
CLIENT_PORT=2500           # Default: 3000
API_PORT=5700              # Default: 5500
API_ADDRESS=192.168.1.14   # Default: localhost
```

> If you want to use this app across the network set `API_ADDRESS` as the computer (where LinkWarden is hosted) IP address.

### Manual Setup

1. Make sure your MongoDB database and collection is up and running.

2. Edit [URI, Database name and Collection name](api/config.js) accordingly.

3. [Optional] If you want to use this app across the network change [`API_HOST`](src/config.js) address with the computer IP and API port.

4. Head to the main folder using terminal and run: `(cd api && npm install) && npm install --legacy-peer-deps` for the dependencies.

5. Run `npm start` to start the application.

## LinkWarden Development

All contributions are welcomed! But first please take a look at [how to contribute](.github/CONTRIBUTING.md).

> **For questions/help, feature requests and bug reports please create an [issue](https://github.com/Daniel31x13/link-warden/issues) (please use the right lable).**
