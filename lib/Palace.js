class Palace {

    constructor() {


        // SETUP
        this.RoomsPerSide = 16; 

        
        // MEMORIES
        
        this.Memories = []; 
        this.MemoryCount = 0; 


        // ROOMS 
        
        this.Rooms = []; 
        for(let y = 0; y < this.RoomsPerSide; ++y) {
            this.Rooms[y] = []; 
            for(let x = 0; x < this.RoomsPerSide; ++x) {
                this.Rooms[y][x] = {
                    
                    // CONVENIENCE
                    x: x, 
                    y: y, 

                    // WHETHER YOU CAN WALK IN THE ROOM
                    active: false, 
                    
                    // THE MEMORIES
                    memories: {
                        north: null, 
                        east: null, 
                        south: null, 
                        west: null, 
                    }, 
                }
            }
        }
    }

    load(palace) {
        if(!palace.Rooms || palace.Memories === undefined) {
            console.error('TRIED TO LOAD PALACE THAT WAS MISSING DATA'); 
            return; 
        }

        console.log('LOADING…', palace); 

        for(let i = 0; i < this.RoomsPerSide; ++i) {
            this.Rooms[i] = palace.Rooms[i]; 
        }

        palace.Memories.forEach(memory => {
            if(memory.id !== undefined && memory.extension && memory.fileName) {
                console.log('LOADING IMAGE…'); 
                const newMemoryObj = {
                    id: memory.id, 
                    extension: memory.extension, 
                    fileName: memory.fileName, 
                    handle: memory.handle, 
                    assertion: memory.assertion, 
                }; 
                this.Memories.push(newMemoryObj); 
            }
        }); 
        this.MemoryCount = palace.Memories.length; 

    }

    async addMemory(file) {
        let value = -1; 

        const id = this.MemoryCount; 
        const extension = 'png'; 
        const name = `${id}.${extension}`; 
        
        const tmpFile = await this.Storage.MemoryImages.getFileHandle(name, { 'create': true }); 
        const tmpWtr = await tmpFile.createWritable(); 
        try {

            await tmpWtr.write(file);
            

            // SUCCEEDED IN WRITING THE FILE

            value = id; 
            // COMMENTED OUT TO PREVENT SAVING LOTS OF IMAGES DURING TESTING
            ++this.MemoryCount; 

            this.Memories.push({
                id: id, 
                extension: extension, 
                fileName: name, 
                handle: tmpFile, 
                assertion: '',
            }); 

        } finally {
            await tmpWtr.close();
        }

        return value; 
        
    }

    getRoomsPerSide() {
        return this.RoomsPerSide; 
    }

    async Build() {
        this.Storage = {}; 
        this.Storage.Root = await navigator.storage.getDirectory(); 
        this.Storage.MemoryImages = await this.Storage.Root.getDirectoryHandle('tmp', { 'create': true }); 
    }

    Save() {
        console.log('SAVE', this); 
        localStorage.setItem('palace', JSON.stringify(this)); 
    }

}

export default Palace; 