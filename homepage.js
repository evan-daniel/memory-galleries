import Palace from './lib/Palace.js'; 

window.addEventListener('DOMContentLoaded', async () => {
    const roomsPerSide = 16; 
    document.documentElement.style.setProperty('--rooms-per-side', `${roomsPerSide}`); 

    // DATA

    let palace = new Palace(); 
    await palace.Build(); 
    console.log(palace); 

    for(let i = 0; i < palace.MemoryCount; ++i) {
        const template = document.querySelector('template[type="memory"]'); 
        const memory = template.content; 
        memory.querySelector('.assertion').innerText = palace.Memories[i].assertion; 
        document.querySelector('.memories').prepend(memory); 

        const imgFile = await palace.Storage.MemoryImages.getFileHandle(`${palace.Memories[i].id}.${palace.Memories[i].extension}`);
        const memoryImg = await imgFile.getFile();
        const rdr = new FileReader(); 

        rdr.addEventListener('load', load => {
            const res = rdr.result; 
            document.querySelector('.memory').style.backgroundImage = `URL("${res}")`; 
        }); 
        rdr.readAsDataURL(memoryImg); 

        
    }

    // STORAGE

    const rootDirectory = await navigator.storage.getDirectory(); 
    loadPngFromOriginPrivateFileSystemIntoCanvas(rootDirectory, document.querySelector('#myCanvas')); 
    
    // INIT
    
    let rooms = []; 
    for(let y = 0; y < roomsPerSide; ++y) {
        rooms[y] = []; 
        for(let x = 0; x < roomsPerSide; ++x) {
            rooms[y][x] = {
                column: x, 
                row: y, 
                active: false, 
                loci: { 
                    north: undefined, 
                    east: undefined, 
                    south: undefined, 
                    west: undefined, 
                }, 
            }; 
        }
    }
    rooms[0][0].loci.south = { 
        url: '/mnt/file.jpg', 
        ans: 'coefficient of static friction', 
        active: false, 
    }

    // INIT
    
    const roomsDom = document.createDocumentFragment('div'); 
    for(let y = 0; y < roomsPerSide; ++y) {
        for(let x = 0; x < roomsPerSide; ++x) {
            const room = document.createElement('div'); 
            room.classList.add('room'); 
            room.setAttribute('column', x); 
            room.setAttribute('row', y);
            room.setAttribute('active', false);  
            roomsDom.appendChild(room); 

            if(rooms[y][x].loci.south) {
                const loci = document.createElement('div'); 
                loci.classList.add('loci', 'loci-north'); 
                room.appendChild(loci); 
            }
        }
    }
    document.querySelector('.floor-plan').append(roomsDom); 
    
    // MAP
    
    const parse_FloorPlan = () => {
        document.querySelectorAll('.room').forEach(room => {
            rooms[+room.getAttribute('row')][+room.getAttribute('column')].active = room.getAttribute('active') === 'true'; 
        }); 
    }; 

    // EVENT

    const roomActivation = clickRoom => {
        const room = clickRoom.target; 

        if(room.classList.contains('room') && clickRoom.buttons === 1) {
            room.setAttribute('active', room.getAttribute('active') !== 'true'); 

            parse_FloorPlan(); 
            localStorage.setItem('rooms', JSON.stringify(rooms)); 
        }
    }
    document.querySelector('.floor-plan').addEventListener('mousedown', roomActivation); 
    document.querySelector('.floor-plan').addEventListener('mouseover', roomActivation); 

    document.querySelector('.memory').addEventListener('change', async change => {
        console.log(change); 
        const reader = new FileReader(); 
        reader.addEventListener('load', load => {
            const res = reader.result; 
            document.querySelector('.memory').style.backgroundImage = `URL("${res}")`; 
        }); 
        reader.readAsDataURL(document.querySelector('.memory').files[0]); 

        const tmpDirectory = await rootDirectory.getDirectoryHandle('tmp', { 'create': true }); 
        const tmpFile = await tmpDirectory.getFileHandle('tst_file.png', { 'create': true }); 
        const tmpWtr = await tmpFile.createWritable(); 
        try {
            await tmpWtr.write( document.querySelector('.memory').files[0] );
        }
        finally {
            await tmpWtr.close();
        }
        
    })

}); 


async function loadPngFromOriginPrivateFileSystemIntoCanvas( storageRoot, canvasElem ) {
    
    const artSubDir = await storageRoot.getDirectoryHandle( "tmp" );
    const savedFile = await artSubDir.getFileHandle( "tst_file.png" ); // Surprisingly there isn't a "fileExists()" function: instead you need to iterate over all files, which is odd... https://wicg.github.io/file-system-access/
    
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
