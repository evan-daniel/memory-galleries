class Palace {

    constructor() {

        // SETUP
        this.RoomsPerSide = 16; 

        // MEMORIES
        
        this.Memories = []; 
        this.MemoryCount = 0; 

        // TEST ADD MEMORY

        this.Memories[0] = {
            id: 'tst_file', 
            extension: 'png', 
            assertion: 'fooy', 
        }; 
        ++this.MemoryCount; 

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

    addMemory(test) {
        this.Memories.push({
            id: this.MemoryCount++, 
            assertion: '', 
        }); 
    }

    getRoomsPerSide() {
        return this.RoomsPerSide; 
    }

    async Build() {
        this.Storage = {}; 
        this.Storage.Root = await navigator.storage.getDirectory(); 
        this.Storage.MemoryImages = await this.Storage.Root.getDirectoryHandle('tmp', { 'create': true }); 
    }

}

export default Palace; 