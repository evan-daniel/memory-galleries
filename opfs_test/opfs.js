async function doOpfsDemo(save) {

    // Open the "root" of the website's (origin's) private filesystem:
    let storageRoot = null;
    try {
        storageRoot = await navigator.storage.getDirectory();
    }
    catch( err ) {
        console.error( err );
        alert( "Couldn't open OPFS. See browser console.\n\n" + err );
        return;
    }

    // Get the <canvas> element from the page DOM:
    const canvasElem = document.getElementById( 'myCanvas' );

    // Save the image:
    if(save) {
        await saveCanvasToPngInOriginPrivateFileSystem( storageRoot, canvasElem );
    } else {
        await loadPngFromOriginPrivateFileSystemIntoCanvas( storageRoot, canvasElem );
    }

    // (Re-)load the image:
}

async function saveCanvasToPngInOriginPrivateFileSystem( storageRoot, canvasElem ) {

    // Save the <canvas>'s image to a PNG file to an in-memory Blob object: (see https://stackoverflow.com/a/57942679/159145 ):
    const imagePngBlob = await new Promise(resolve => canvasElem.toBlob( resolve, 'image/png' ) );

    // Create an empty (zero-byte) file in a new subdirectory: "art/mywaifu.png":
    const newSubDir = await storageRoot.getDirectoryHandle( "art", { "create" : true });
    const newFile   = await newSubDir.getFileHandle( "mywaifu.png", { "create" : true });

    // Open the `mywaifu.png` file as a writable stream ( FileSystemWritableFileStream ):
    const wtr = await newFile.createWritable();
    try {
        // Then write the Blob object directly:
        await wtr.write( imagePngBlob );
    }
    finally {
        // And safely close the file stream writer:
        await wtr.close();
    }
}

async function loadPngFromOriginPrivateFileSystemIntoCanvas( storageRoot, canvasElem ) {
    
    const artSubDir = await storageRoot.getDirectoryHandle( "art" );
    const savedFile = await artSubDir.getFileHandle( "mywaifu.png" ); // Surprisingly there isn't a "fileExists()" function: instead you need to iterate over all files, which is odd... https://wicg.github.io/file-system-access/
    
    // Get the `savedFile` as a DOM `File` object (as opposed to a `FileSystemFileHandle` object):
    const pngFile = await savedFile.getFile();
    
    // Load it into an ImageBitmap object which can be painted directly onto the <canvas>. You don't need to use URL.createObjectURL and <img/> anymore. See https://developer.mozilla.org/en-US/docs/Web/API/createImageBitmap
    // But you *do* still need to `.close()` the ImageBitmap after it's painted otherwise you'll leak memory. Use a try/finally block for that.
    try {
        const loadedBitmap = await createImageBitmap( pngFile ); // `createImageBitmap()` is a global free-function, like `parseInt()`. Which is unusual as most modern JS APIs are designed to not pollute the global scope.
        try {
            const ctx = canvasElem.getContext('2d');
            ctx.clearRect( /*x:*/ 0, /*y:*/ 0, ctx.canvas.width, ctx.canvas.height ); // Clear the canvas before drawing the loaded image.
            ctx.drawImage( loadedBitmap, /*x:*/ 0, /*y:*/ 0 ); // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
        }
        finally {
            loadedBitmap.close(); // https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap/close
        }
    }
    catch( err ) {
        console.error( err );
        alert( "Couldn't load previously saved image into <canvas>. See browser console.\n\n" + err );
        return;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const context = document.querySelector('canvas').getContext('2d'); 
    context.fillStyle = '#aaf'; 
    context.fillRect(0, 0, context.canvas.width, context.canvas.height); 
    context.fillStyle = '#afa'; 
    context.fillRect(50, 50, 50, 50); 

    doOpfsDemo(false); 

    context.canvas.addEventListener('click', click => {

        context.fillStyle = '#0f0'; 
        context.fillRect(click.x, click.y, 30, 30);
        context.strokeRect(click.x, click.y, 30, 30); 
        doOpfsDemo(true); 
    }); 
    
}); 