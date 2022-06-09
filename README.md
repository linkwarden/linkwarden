<div align="center">
<h1>
LinkWarden
<br/>
<sub>A place for your useful links.</sub>
        
![GitHub](https://img.shields.io/github/license/daniel31x13/link-warden?style=flat-square)  ![GitHub top language](https://img.shields.io/github/languages/top/daniel31x13/link-warden?style=flat-square) ![GitHub commit activity](https://img.shields.io/github/commit-activity/m/daniel31x13/link-warden?style=flat-square) ![GitHub last commit](https://img.shields.io/github/last-commit/daniel31x13/link-warden?style=flat-square)
</h1>

</div>

## Intro & Motivation
**LinkWarden is a self-hosted, open-source bookmark + archive manager to collect, and save websites for offline use.**

The objective is to have a self-hosted place to keep useful links in one place, and since useful links can go away (see the inevitability of [Link Rot](https://www.howtogeek.com/786227/what-is-link-rot-and-how-does-it-threaten-the-web/)), LinkWarden also saves a copy of the link as screenshot and PDF.

## Features
- [x] Sleek, minimalist design.
- [x] Save a copy of each link as screenshot and PDF.
- [x] Dark/Light mode support.
- [x] Responsive design.
- [x] Search, filter and sorting functionality.
- [x] Lazy loading support (for better performance).
- [x] Set multiple tags to each link.

### Other planned Features
(These are not 100% guaranteed, they're just idea's.)
- [ ] Add time stamps to links.
- [ ] Browser extenstions.
- [ ] Docker support.
- [ ] Save as [SingleFile](https://github.com/gildas-lormeau/SingleFile).
- [ ] Folder support.
- [ ] Sidenav.
- [ ] A design logo.

## Setup
### Linux/MacOS
1. Make sure your MongoDB database and collection is up and running.

2. Edit `/src/config.js` accordingly.

3. Head to the main folder using terminal and run: `(cd api && npm install) && npm install --legacy-peer-deps` for the dependancies.

4. Run `npm start` to start the application.

## LinkWarden Development
All contributions are welcomed! Please take a look at [how to contribute](.github/CONTRIBUTING.md).

> **For questions/help, feature requests and bug reports please create an [issue](https://github.com/Daniel31x13/link-warden/issues) (please use the right lable).**