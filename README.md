# memorygalleries.com

This is source code for [memorygalleries.com](https://memorygalleries.com).  

## Structure 

- Webpack is used for organization.  
- Local storage is used to persist user "galleries".  
- The Origin Private File System (OPFS) is used to store images.  
- Three.js is used to translate images and data into a 3D world. 
- Physics elements (movement, collision detection) are simple and built from scratch.  
- OpenAI Dall•E API is used for image generation (images can also be uploaded).  

## Concept 

The idea behind this project is "populate a memory palace using AI-generated images."  

The "Memory Palace" technique dates back to ancient Greece ("The Method of Loci"), and is still used today by memory competition champions.  The procedure is to associate items you want to memorize with striking images placed in a physical space.  

In this version, the "palace" is called a "gallery": 
- Users draw the floor plan.  
- They type in what they want to memorize and a vivid image to help them remember it.  The image is created by the OpenAI API.  
- When they start the game itself, a 3D gallery is generated based on their floor plan, with the images represented as "paintings".  Users can test themselves by typing in the content they wish to remember. 

![Floor Plan Interface](https://github.com/evan-daniel/memory-galleries/blob/master/memory-galleries-floor-plan.png) 

![Game Interface](https://github.com/evan-daniel/memory-galleries/blob/master/memory-galleries-pic.png) 
