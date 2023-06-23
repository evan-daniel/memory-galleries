# lociai.com

This is source code for [lociai.com](https://lociai.com).  

For documentation, see [https://evandaniel.com/loci_ai](https://evandaniel.com/loci_ai).  

## Structure 

The site uses webpack for standardization purposes.  Frameworks were decided against since the structure of the site is simple, but the API usage was more complex.  

### Storage 

Local storage was used to persist user data, which is wrangled using a single class.  One of the biggest questions was how to store images that would persist across visits to the site without the use of a database.  The decision was made to leverage an API introduced to Chromium browsers in 2022, the Origin Private File System (OPFS).  This virtual filesystem stores and saves image data locally.  

### Three.js

The site translates a 2D map into a 3D world.  Because custom effects are not needed (i.e. via WebGL), Three.js was leveraged.  Since the emphasis of the game is navigation and interactivity over narrative elements, the game engine (comprised of a navigation system with collision detection and raycasting) was built from scratch.  The textures are simple; intended to replicate the feeling of a gallery.  

### AI 

An integral component of the site's functionality is the ability to compose a gallery on-the-fly.  The decision was made to leverage OpenAI's DALL•E API.  The request is sent from the Nodejs backend.  The file is retrieved and then stored locally to simplify development, and to avoid storing user passwords and files remotely, which has attendant privacy and legal issues.  A key affordance was made by including the ability to download images; this invites users to store and transfer their data themselves.  